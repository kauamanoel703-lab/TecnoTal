const userRoutes = require('express').Router();
const controller = require('../controllers/userController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

userRoutes.use(authRequired);

userRoutes.get('/', requirePermission('usuarios.listar'), controller.listar);
userRoutes.post('/', requirePermission('usuarios.criar'), controller.criar);
userRoutes.put('/:id', requirePermission('usuarios.editar'), controller.atualizar);
userRoutes.put('/perfil/me', controller.perfil); // próprio perfil

module.exports = userRoutes;
