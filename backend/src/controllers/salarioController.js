// ============================================================
// Módulo Salários: definição, pagamento e histórico
// ADMIN/GESTOR gerenciam; funcionário vê só o próprio
// ============================================================
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

const brl2num = (v) => Math.round(Number(v) * 100) / 100;

// GET /api/business/salarios — lista de funcionários com salário e status do mês atual (gestor)
async function listar(req, res, next) {
  try {
    const mesAtual = new Date().toLocaleDateString('sv-SE').slice(0, 7); // YYYY-MM
    const [rows] = await db.execute(
      `SELECT u.id AS usuarioId, u.nome, u.email, c.nome AS cargo,
              IFNULL(s.valor_mensal, 0) AS valorMensal, IFNULL(s.dia_pagamento, 5) AS diaPagamento,
              s.id AS salarioId,
              EXISTS(SELECT 1 FROM pagamentos p WHERE p.usuario_id = u.id AND p.referencia_mes = ?) AS pagoEsteMes,
              (SELECT MAX(p.data_pagamento) FROM pagamentos p WHERE p.usuario_id = u.id) AS ultimoPagamento
         FROM usuarios u
         JOIN cargos c ON c.id = u.cargo_id
         LEFT JOIN salarios s ON s.usuario_id = u.id AND s.ativo = 1
        WHERE u.ativo = 1 AND u.cargo_id != 1
        ORDER BY u.nome`,
      [mesAtual]
    );
    res.json({ mes: mesAtual, funcionarios: rows });
  } catch (err) { next(err); }
}

// PUT /api/business/salarios/:usuarioId — define/atualiza o salário base (admin/gestor)
async function definir(req, res, next) {
  try {
    const valor = brl2num(req.body?.valorMensal);
    const diaPag = Number(req.body?.diaPagamento) || 5;
    if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ erro: 'Valor mensal inválido' });
    if (diaPag < 1 || diaPag > 28) return res.status(400).json({ erro: 'Dia de pagamento deve ser entre 1 e 28' });

    const [[user]] = await db.execute('SELECT nome FROM usuarios WHERE id = ?', [req.params.usuarioId]);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    await db.execute(
      `INSERT INTO salarios (usuario_id, valor_mensal, dia_pagamento)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE valor_mensal = VALUES(valor_mensal), dia_pagamento = VALUES(dia_pagamento), ativo = 1`,
      [req.params.usuarioId, valor, diaPag]
    );
    await registrarAtividade(req.user.id, 'DEFINIR_SALARIO', `${user.nome}: R$ ${valor.toFixed(2)} (dia ${diaPag})`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// POST /api/business/salarios/:usuarioId/pagar — registra pagamento do mês (admin/gestor)
async function pagar(req, res, next) {
  try {
    const usuarioId = req.params.usuarioId;
    const mes = req.body?.referenciaMes || new Date().toLocaleDateString('sv-SE').slice(0, 7);
    // validação YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ erro: 'Mês de referência inválido (use YYYY-MM)' });

    // valor: informado ou o salário base cadastrado
    let valor;
    if (req.body?.valorPago !== undefined && req.body.valorPago !== null && req.body.valorPago !== '') {
      valor = brl2num(req.body.valorPago);
      if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ erro: 'Valor pago inválido' });
    } else {
      const [[sal]] = await db.execute('SELECT valor_mensal FROM salarios WHERE usuario_id = ? AND ativo = 1', [usuarioId]);
      if (!sal) return res.status(400).json({ erro: 'Funcionário sem salário definido — defina antes de pagar' });
      valor = brl2num(sal.valor_mensal);
    }

    const [[user]] = await db.execute('SELECT nome FROM usuarios WHERE id = ?', [usuarioId]);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    try {
      await db.execute(
        `INSERT INTO pagamentos (usuario_id, valor_pago, referencia_mes, data_pagamento, observacao, registrado_por)
         VALUES (?, ?, ?, CURDATE(), ?, ?)`,
        [usuarioId, valor, mes, req.body?.observacao || null, req.user.id]
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: `${user.nome} já possui pagamento registrado em ${mes}` });
      }
      throw e;
    }

    await registrarAtividade(req.user.id, 'REGISTRAR_PAGAMENTO', `${user.nome} R$ ${valor.toFixed(2)} ref. ${mes}`, req.ip);

    // avisa o funcionário pelo sino
    const { notificar } = require('./notificacaoController');
    notificar(usuarioId, '💰 Pagamento registrado', `R$ ${valor.toFixed(2)} referente a ${mes}`).catch(() => {});

    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/business/salarios/historico — todos os pagamentos (gestor), paginado por mês
async function historico(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, u.nome AS funcionario, p.valor_pago AS valorPago,
              p.referencia_mes AS referenciaMes, DATE_FORMAT(p.data_pagamento,'%d/%m/%Y') AS dataPagamento,
              p.observacao, r.nome AS registradoPor
         FROM pagamentos p
         JOIN usuarios u ON u.id = p.usuario_id
         JOIN usuarios r ON r.id = p.registrado_por
        ORDER BY p.referencia_mes DESC, u.nome`
    );
    // total por mês pra resumo
    const totais = {};
    rows.forEach((p) => {
      totais[p.referenciaMes] = brl2num((totais[p.referenciaMes] || 0) + Number(p.valorPago));
    });
    res.json({ pagamentos: rows, totaisPorMes: totais });
  } catch (err) { next(err); }
}

// GET /api/business/salarios/meu — o funcionário vê seus pagamentos
async function meu(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT valor_pago AS valorPago, referencia_mes AS referenciaMes,
              DATE_FORMAT(data_pagamento,'%d/%m/%Y') AS dataPagamento, observacao
         FROM pagamentos WHERE usuario_id = ?
        ORDER BY referencia_mes DESC LIMIT 24`,
      [req.user.id]
    );
    const [[sal]] = await db.execute(
      'SELECT valor_mensal AS valorMensal, dia_pagamento AS diaPagamento FROM salarios WHERE usuario_id = ? AND ativo = 1',
      [req.user.id]
    );
    res.json({ salario: sal || null, pagamentos: rows });
  } catch (err) { next(err); }
}

module.exports = { listar, definir, pagar, historico, meu };
