const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

async function listarMinhas(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, st.nome AS status
         FROM solicitacoes s JOIN status_solicitacoes st ON st.id = s.status_id
        WHERE s.usuario_id = ? ORDER BY s.criado_em DESC`,
      [req.user.id]
    );
    res.json({ solicitacoes: rows });
  } catch (err) { next(err); }
}

async function listarTodas(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, st.nome AS status, u.nome AS usuario, a.nome AS aprovador
         FROM solicitacoes s
         JOIN status_solicitacoes st ON st.id = s.status_id
         JOIN usuarios u ON u.id = s.usuario_id
         LEFT JOIN usuarios a ON a.id = s.aprovador_id
        ORDER BY s.criado_em DESC`
    );
    res.json({ solicitacoes: rows });
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { titulo, descricao } = req.body || {};
    if (!titulo || titulo.trim().length < 3) {
      return res.status(400).json({ erro: 'Título obrigatório (mín. 3 caracteres)' });
    }
    const [r] = await db.execute(
      `INSERT INTO solicitacoes (usuario_id, titulo, descricao, status_id)
       VALUES (?, ?, ?, 1)`,
      [req.user.id, titulo.trim(), descricao || null]
    );
    await registrarAtividade(req.user.id, 'CRIAR_SOLICITACAO', `id=${r.insertId}`, req.ip);
    return res.status(201).json({ ok: true, id: r.insertId });
  } catch (err) { next(err); }
}

async function decidir(req, res, next) {
  try {
    const { id } = req.params;
    const { acao, observacao } = req.body || {}; // acao: aprovar | rejeitar
    if (!['aprovar', 'rejeitar'].includes(acao)) {
      return res.status(400).json({ erro: 'Ação inválida' });
    }
    const statusId = acao === 'aprovar' ? 2 : 3;

    const [rows] = await db.execute('SELECT id, status_id FROM solicitacoes WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Solicitação não encontrada' });
    if (rows[0].status_id !== 1) return res.status(409).json({ erro: 'Solicitação já decidida' });

    await db.execute(
      `UPDATE solicitacoes
          SET status_id = ?, aprovador_id = ?, resposta = ?, decidido_em = NOW()
        WHERE id = ?`,
      [statusId, req.user.id, observacao || null, id]
    );
    await registrarAtividade(req.user.id, acao === 'aprovar' ? 'APROVAR_SOLICITACAO' : 'REJEITAR_SOLICITACAO', `id=${id}`, req.ip);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listarMinhas, listarTodas, criar, decidir };
