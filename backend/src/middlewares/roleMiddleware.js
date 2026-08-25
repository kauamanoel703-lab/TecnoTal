const db = require('../database/connection');

// Cache de permissões por cargo (recarrega a cada 60s)
let cache = new Map();
let cacheAt = 0;

async function permissoesDoCargo(cargoId) {
  if (Date.now() - cacheAt > 60_000) cache = new Map();
  if (!cache.has(cargoId)) {
    const [rows] = await db.execute(
      `SELECT p.codigo
         FROM cargo_permissoes cp
         JOIN permissoes p ON p.id = cp.permissao_id
        WHERE cp.cargo_id = ?`,
      [cargoId]
    );
    cache.set(cargoId, rows.map((r) => r.codigo));
  }
  return cache.get(cargoId);
}

// requireRole('ADMIN') — por cargo
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ erro: 'Não autenticado' });
  if (!roles.includes(req.user.cargo)) {
    return res.status(403).json({ erro: 'Sem permissão para esta ação' });
  }
  next();
};

// requirePermission('usuarios.criar') — RBAC de verdade, via banco
const requirePermission = (codigo) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    const perms = await permissoesDoCargo(req.user.cargoId);
    if (!perms.includes(codigo)) {
      return res.status(403).json({ erro: 'Sem permissão para esta ação' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole, requirePermission };
