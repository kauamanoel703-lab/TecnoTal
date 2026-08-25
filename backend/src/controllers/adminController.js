const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

// GET /api/admin/cargos — lista cargos com suas permissões
async function listarCargos(req, res, next) {
  try {
    const [cargos] = await db.execute('SELECT id, nome, descricao FROM cargos ORDER BY id');
    const [perms] = await db.execute(
      `SELECT cp.cargo_id, p.id, p.codigo, p.descricao
         FROM cargo_permissoes cp JOIN permissoes p ON p.id = cp.permissao_id
        ORDER BY p.codigo`
    );
    const resultado = cargos.map((c) => ({
      ...c,
      permissoes: perms.filter((p) => p.cargo_id === c.id).map(({ id, codigo, descricao }) => ({ id, codigo, descricao })),
    }));
    res.json({ cargos: resultado });
  } catch (err) { next(err); }
}

// PUT /api/admin/cargos/:cargoId/permissoes — substitui o conjunto de permissões do cargo
async function setPermissoes(req, res, next) {
  try {
    const { cargoId } = req.params;
    const { permissoes } = req.body || {}; // array de códigos
    if (!Array.isArray(permissoes)) return res.status(400).json({ erro: 'Envie um array de permissões' });

    // impede travar o sistema: ADMIN sempre mantém acesso total
    const [cargo] = await db.execute('SELECT nome FROM cargos WHERE id = ?', [cargoId]);
    if (!cargo[0]) return res.status(404).json({ erro: 'Cargo não encontrado' });
    let final = [...permissoes];
    if (cargo[0].nome === 'ADMIN') {
      const [todas] = await db.execute('SELECT codigo FROM permissoes');
      final = todas.map((t) => t.codigo);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM cargo_permissoes WHERE cargo_id = ?', [cargoId]);
      for (const codigo of final) {
        await conn.execute(
          `INSERT INTO cargo_permissoes (cargo_id, permissao_id)
           SELECT ?, id FROM permissoes WHERE codigo = ?`,
          [cargoId, codigo]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    await registrarAtividade(req.user.id, 'ALTERAR_PERMISSOES', `cargo=${cargo[0].nome} (${final.length} perms)`, req.ip);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/admin/configuracoes
async function getConfiguracoes(req, res, next) {
  try {
    const [rows] = await db.execute('SELECT chave, valor FROM configuracoes ORDER BY chave');
    res.json({ configuracoes: rows });
  } catch (err) { next(err); }
}

// PUT /api/admin/configuracoes — body: { chave: valor, ... }
async function setConfiguracoes(req, res, next) {
  try {
    const entradas = Object.entries(req.body || {});
    if (!entradas.length) return res.status(400).json({ erro: 'Nada para salvar' });
    for (const [chave, valor] of entradas) {
      await db.execute(
        `INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [chave, String(valor)]
      );
    }
    await registrarAtividade(req.user.id, 'ALTERAR_CONFIGURACOES', entradas.map(([k]) => k).join(','), req.ip);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listarCargos, setPermissoes, getConfiguracoes, setConfiguracoes };
