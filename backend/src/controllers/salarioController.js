// Salários v2: com departamento (área) e nível de cargo na seção de pagamentos
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

const brl2num = (v) => Math.round(Number(v) * 100) / 100;
const NIVEIS = ['JUNIOR', 'PLENO', 'SENIOR', 'COORDENACAO'];
const DEPTOS = ['RH', 'TI', 'ADMINISTRATIVO', 'VENDAS', 'OPERACOES', 'GERAL'];

// PUT /api/salarios/:usuarioId — agora recebe nivel + departamento também
async function definir(req, res, next) {
  try {
    const valor = req.body?.valorMensal !== undefined ? brl2num(req.body.valorMensal) : null;
    const diaPag = Number(req.body?.diaPagamento) || 5;
    const nivel = NIVEIS.includes(req.body?.nivel) ? req.body.nivel : 'PLENO';
    const departamento = req.body?.departamento === '' ? 'GERAL'
      : (DEPTOS.includes(req.body?.departamento) ? req.body.departamento : 'GERAL');

    if (valor !== null && (!Number.isFinite(valor) || valor <= 0)) {
      return res.status(400).json({ erro: 'Valor mensal inválido' });
    }
    if (diaPag < 1 || diaPag > 28) return res.status(400).json({ erro: 'Dia de pagamento deve ser entre 1 e 28' });

    const [[user]] = await db.execute('SELECT nome FROM usuarios WHERE id = ?', [req.params.usuarioId]);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    // upsert mantendo valor anterior se só mudou área/nível
    await db.execute(
      `INSERT INTO salarios (usuario_id, valor_mensal, nivel, departamento, dia_pagamento)
       VALUES (?, COALESCE(?, 0), ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         valor_mensal = IF(VALUES(valor_mensal) > 0, VALUES(valor_mensal), valor_mensal),
         nivel = VALUES(nivel), departamento = VALUES(departamento),
         dia_pagamento = VALUES(dia_pagamento), ativo = 1`,
      [req.params.usuarioId, valor, nivel, departamento, diaPag]
    );
    await registrarAtividade(req.user.id, 'DEFINIR_SALARIO',
      `${user.nome}: ${valor ? 'R$ ' + valor.toFixed(2) : '(sem valor)'} · ${nivel} · ${departamento}`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/salarios — folha agrupável por área/nível
async function listar(req, res, next) {
  try {
    const mesAtual = new Date().toLocaleDateString('sv-SE').slice(0, 7);
    const [rows] = await db.execute(
      `SELECT u.id AS usuarioId, u.nome, u.email, c.nome AS cargo,
              IFNULL(s.valor_mensal,0) AS valorMensal,
              s.nivel, IFNULL(s.departamento,'GERAL') AS departamento,
              IFNULL(s.dia_pagamento,5) AS diaPagamento,
              EXISTS(SELECT 1 FROM pagamentos p WHERE p.usuario_id=u.id AND p.referencia_mes=?) AS pagoEsteMes
         FROM usuarios u JOIN cargos c ON c.id=u.cargo_id
         LEFT JOIN salarios s ON s.usuario_id=u.id AND s.ativo=1
        WHERE u.ativo=1 AND u.cargo_id != 1
        ORDER BY s.departamento, c.nome, u.nome`,
      [mesAtual]
    );
    // totais por departamento
    const totaisPorDepto = {};
    rows.forEach((f) => {
      const d = f.departamento || 'GERAL';
      totaisPorDepto[d] = brl2num((totaisPorDepto[d] || 0) + Number(f.valorMensal));
    });
    res.json({ mes: mesAtual, funcionarios: rows, totaisPorDepto });
  } catch (err) { next(err); }
}

async function pagar(req, res, next) {
  try {
    const usuarioId = req.params.usuarioId;
    const mes = req.body?.referenciaMes || new Date().toLocaleDateString('sv-SE').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ erro: 'Mês inválido' });

    let valor;
    if (req.body?.valorPago != null && req.body.valorPago !== '') {
      valor = brl2num(req.body.valorPago);
      if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ erro: 'Valor pago inválido' });
    } else {
      const [[sal]] = await db.execute('SELECT valor_mensal FROM salarios WHERE usuario_id=? AND ativo=1', [usuarioId]);
      if (!sal) return res.status(400).json({ erro: 'Funcionário sem salário definido' });
      valor = brl2num(sal.valor_mensal);
    }

    const [[user]] = await db.execute(
      'SELECT u.nome, IFNULL(s.departamento,"GERAL") AS depto FROM usuarios u LEFT JOIN salarios s ON s.usuario_id=u.id WHERE u.id=?',
      [usuarioId]
    );
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    try {
      await db.execute(
        `INSERT INTO pagamentos (usuario_id, valor_pago, referencia_mes, referencia_departamento, data_pagamento, observacao, registrado_por)
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?)`,
        [usuarioId, valor, mes, user.depto, req.body?.observacao || null, req.user.id]
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: `${user.nome} já recebeu em ${mes}` });
      throw e;
    }
    await registrarAtividade(req.user.id, 'REGISTRAR_PAGAMENTO', `${user.nome} R$ ${valor.toFixed(2)} ref. ${mes} (${user.depto})`, req.ip);
    const { notificar } = require('./notificacaoController');
    notificar(Number(usuarioId), '💰 Pagamento registrado', `R$ ${valor.toFixed(2)} referente a ${mes}`).catch(() => {});
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/salarios/historico?departamento=TI&nivel=SENIOR
async function historico(req, res, next) {
  try {
    let sql = `SELECT p.id, u.nome AS funcionario, p.valor_pago AS valorPago,
                      p.referencia_mes AS referenciaMes, p.referencia_departamento AS departamento,
                      DATE_FORMAT(p.data_pagamento,'%d/%m/%Y') AS dataPagamento,
                      p.observacao, r.nome AS registradoPor
                 FROM pagamentos p
                 JOIN usuarios u ON u.id=p.usuario_id
                 JOIN usuarios r ON r.id=p.registrado_por
                WHERE 1=1`;
    const params = [];
    if (req.query.departamento && DEPTOS.includes(req.query.departamento)) {
      sql += ' AND p.referencia_departamento = ?'; params.push(req.query.departamento);
    }
    sql += ' ORDER BY p.referencia_mes DESC, u.nome';
    const [rows] = await db.execute(sql, params);
    const totais = {};
    rows.forEach((p) => { totais[p.referenciaMes] = brl2num((totais[p.referenciaMes] || 0) + Number(p.valorPago)); });
    res.json({ pagamentos: rows, totaisPorMes: totais });
  } catch (err) { next(err); }
}

// funcionário: o próprio
async function meu(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT valor_pago AS valorPago, referencia_mes AS referenciaMes,
              DATE_FORMAT(data_pagamento,'%d/%m/%Y') AS dataPagamento, observacao
         FROM pagamentos WHERE usuario_id = ? ORDER BY referencia_mes DESC LIMIT 24`,
      [req.user.id]
    );
    const [[sal]] = await db.execute(
      'SELECT valor_mensal AS valorMensal, dia_pagamento AS diaPagamento, nivel, departamento FROM salarios WHERE usuario_id=? AND ativo=1',
      [req.user.id]
    );
    res.json({ salario: sal || null, pagamentos: rows });
  } catch (err) { next(err); }
}

module.exports = { listar, definir, pagar, historico, meu };
