const userRoutes = require('express').Router();
const controller = require('../controllers/userController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

userRoutes.use(authRequired);

userRoutes.get('/', requirePermission('usuarios.listar'), controller.listar);
userRoutes.post('/', requirePermission('usuarios.criar'), controller.criar);

// PUT /:id — ADMIN (usuarios.editar) OU RH (rh.cargos_definir) podem editar;
// a regra de quem muda CARGO fica dentro do controller
function podeEditar(req, res, next) {
  const perms = req.user.permissoes || [];
  if (perms.includes('usuarios.editar') || perms.includes('rh.cargos_definir')) return next();
  return res.status(403).json({ erro: 'Sem permissão para editar usuários' });
}
userRoutes.put('/:id', podeEditar, controller.atualizar);

userRoutes.put('/perfil/me', controller.perfil); // próprio perfil

module.exports = userRoutes;
