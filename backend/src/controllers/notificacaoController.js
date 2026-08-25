const db = require('../database/connection');

// GET /api/notifications — minhas notificações (mais recentes primeiro)
async function listar(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT id, titulo, mensagem, lida, criado_em AS criadoEm
         FROM notificacoes
        WHERE usuario_id = ?
        ORDER BY criado_em DESC
        LIMIT 30`,
      [req.user.id]
    );
    const naoLidas = rows.filter((r) => !r.lida).length;
    res.json({ notificacoes: rows, naoLidas });
  } catch (err) { next(err); }
}

// POST /api/notifications/ler-todas — marca todas como lidas
async function marcarLidas(req, res, next) {
  try {
    await db.execute('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND lida = 0', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// util interna: criar notificação para um usuário (usado por outros controllers)
async function notificar(usuarioId, titulo, mensagem) {
  await db.execute(
    'INSERT INTO notificacoes (usuario_id, titulo, mensagem) VALUES (?, ?, ?)',
    [usuarioId, titulo, mensagem || null]
  );
}

// util: avisar todos com determinada permissão (ex: aprovadores)
async function notificarComPermissao(codigoPermissao, titulo, mensagem) {
  await db.execute(
    `INSERT INTO notificacoes (usuario_id, titulo, mensagem)
     SELECT u.id, ?, ?
       FROM usuarios u
       JOIN cargo_permissoes cp ON cp.cargo_id = u.cargo_id
       JOIN permissoes p ON p.id = cp.permissao_id
      WHERE p.codigo = ? AND u.ativo = 1`,
    [titulo, mensagem || null, codigoPermissao]
  );
}

module.exports = { listar, marcarLidas, notificar, notificarComPermissao };
