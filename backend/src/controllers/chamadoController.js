// ============================================================
// Chamados internos: RH, TI, Administrativo
// ============================================================
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

// qual permissão atende cada departamento
const PERM_DEPTO = {
  RH: 'chamados.rh_ver',
  TI: 'chamados.ti_ver',
  ADMINISTRATIVO: 'chamados.adm_ver',
};

// departamentos que o usuário pode ver/atender
function meusDeptos(usuario) {
  if (usuario.cargo === 'ADMIN') return ['RH', 'TI', 'ADMINISTRATIVO'];
  return Object.entries(PERM_DEPTO)
    .filter(([, perm]) => usuario.permissoes?.includes(perm))
    .map(([depto]) => depto);
}

// POST /api/chamados — qualquer funcionário abre chamado pra um setor
async function abrir(req, res, next) {
  try {
    const { departamento, titulo, descricao, prioridade } = req.body || {};
    if (!['RH', 'TI', 'ADMINISTRATIVO'].includes(departamento)) {
      return res.status(400).json({ erro: 'Departamento inválido' });
    }
    if (!titulo || titulo.trim().length < 3) return res.status(400).json({ erro: 'Título obrigatório' });
    const prio = ['BAIXA', 'MEDIA', 'ALTA'].includes(prioridade) ? prioridade : 'MEDIA';

    const [r] = await db.execute(
      `INSERT INTO chamados (aberto_por, departamento, titulo, descricao, prioridade) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, departamento, titulo.trim(), descricao || null, prio]
    );
    await registrarAtividade(req.user.id, 'ABRIR_CHAMADO', `#${r.insertId} ${departamento}`, req.ip);

    // avisa quem atende esse departamento
    const [[deptoRow]] = await db.execute('SELECT nome FROM departamentos WHERE nome = ?', [departamento]);
    const { notificarComPermissao } = require('./notificacaoController');
    notificarComPermissao(
      PERM_DEPTO[departamento],
      `🎫 Novo chamado — ${deptoRow?.nome || departamento}`,
      `${req.user.nome}: "${titulo.trim()}" (${prio})`
    ).catch(() => {});

    res.status(201).json({ ok: true, id: r.insertId });
  } catch (err) { next(err); }
}

// GET /api/chamados?departamento=TI&status=ABERTO
// funcionário vê os seus; atendentes veem os do(s) seu(s) setor(es); admin vê tudo
async function listar(req, res, next) {
  try {
    const { departamento, status } = req.query;
    let sql = `
      SELECT c.id, c.departamento, c.titulo, c.descricao, c.status, c.prioridade,
             c.resposta, DATE_FORMAT(c.criado_em,'%d/%m %H:%i') AS abertoEm,
             u.nome AS abertoPor, IFNULL(a.nome,'—') AS atendidoPor
        FROM chamados c
        JOIN usuarios u ON u.id = c.aberto_por
        LEFT JOIN usuarios a ON a.id = c.atendido_por
       WHERE 1=1`;
    const params = [];

    if (req.user.cargo === 'ADMIN') {
      // vê tudo
    } else {
      const deptos = meusDeptos(req.user);
      const meusOuSetor = deptos.length ? `${deptos.map(() => '?').join(',')}` : null;
      sql += ` AND (c.aberto_por = ?${meusOuSetor ? ` OR c.departamento IN (${meusOuSetor})` : ''})`;
      params.push(req.user.id);
      if (meusOuSetor) deptos.forEach((d) => params.push(d));
    }

    if (departamento && ['RH', 'TI', 'ADMINISTRATIVO'].includes(departamento)) {
      sql += ' AND c.departamento = ?'; params.push(departamento);
    }
    if (status && ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'].includes(status)) {
      sql += ' AND c.status = ?'; params.push(status);
    }
    sql += ' ORDER BY FIELD(c.status,"ABERTO","EM_ATENDIMENTO","RESOLVIDO"), FIELD(c.prioridade,"ALTA","MEDIA","BAIXA"), c.criado_em DESC';

    const [rows] = await db.execute(sql, params);
    res.json({ chamados: rows });
  } catch (err) { next(err); }
}

// POST /api/chamados/:id/assumir — atendente pega o chamado
async function assumir(req, res, next) {
  try {
    const [[c]] = await db.execute('SELECT * FROM chamados WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ erro: 'Chamado não encontrado' });
    if (!meusDeptos(req.user).includes(c.departamento)) {
      return res.status(403).json({ erro: 'Este chamado não é do seu setor' });
    }
    if (c.status !== 'ABERTO') return res.status(409).json({ erro: 'Chamado já está em atendimento ou resolvido' });

    await db.execute("UPDATE chamados SET status='EM_ATENDIMENTO', atendido_por=? WHERE id=?", [req.user.id, c.id]);
    await registrarAtividade(req.user.id, 'ASSUMIR_CHAMADO', `#${c.id}`, req.ip);

    const { notificar } = require('./notificacaoController');
    notificar(c.aberto_por, '🎫 Seu chamado está sendo atendido', `"${c.titulo}" — ${req.user.nome}`).catch(() => {});
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// POST /api/chamados/:id/resolver — encerra com resposta
async function resolver(req, res, next) {
  try {
    const { resposta } = req.body || {};
    if (!resposta || resposta.trim().length < 3) return res.status(400).json({ erro: 'Informe a resolução' });

    const [[c]] = await db.execute('SELECT * FROM chamados WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ erro: 'Chamado não encontrado' });
    if (!meusDeptos(req.user).includes(c.departamento)) {
      return res.status(403).json({ erro: 'Este chamado não é do seu setor' });
    }
    if (c.status === 'RESOLVIDO') return res.status(409).json({ erro: 'Chamado já resolvido' });

    await db.execute(
      "UPDATE chamados SET status='RESOLVIDO', atendido_por=?, resposta=?, fechado_em=NOW() WHERE id=?",
      [c.atendido_por || req.user.id, resposta.trim(), c.id]
    );
    await registrarAtividade(req.user.id, 'RESOLVER_CHAMADO', `#${c.id}`, req.ip);

    const { notificar } = require('./notificacaoController');
    notificar(c.aberto_por, '✅ Chamado resolvido', `"${c.titulo}": ${resposta.trim().slice(0, 80)}`).catch(() => {});
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/chamados/meus-setores — quais filas o usuário atende
async function meusSetores(req, res) {
  res.json({ setores: meusDeptos(req.user) });
}

module.exports = { abrir, listar, assumir, resolver, meusSetores };
