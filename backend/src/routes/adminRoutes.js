const adminRoutes = require('express').Router();
const controller = require('../controllers/adminController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

adminRoutes.use(authRequired);

adminRoutes.get('/cargos', requirePermission('admin.cargos_permissoes'), controller.listarCargos);
adminRoutes.put('/cargos/:cargoId/permissoes', requirePermission('admin.cargos_permissoes'), controller.setPermissoes);
adminRoutes.get('/configuracoes', requirePermission('admin.configuracoes'), controller.getConfiguracoes);
adminRoutes.put('/configuracoes', requirePermission('admin.configuracoes'), controller.setConfiguracoes);

module.exports = adminRoutes;
