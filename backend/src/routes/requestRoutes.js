const requestRoutes = require('express').Router();
const controller = require('../controllers/requestController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

requestRoutes.use(authRequired);

requestRoutes.get('/minhas', controller.listarMinhas);
requestRoutes.get('/', requirePermission('solicitacoes.aprovar'), controller.listarTodas);
requestRoutes.post('/', controller.criar);
requestRoutes.post('/:id/decidir', requirePermission('solicitacoes.aprovar'), controller.decidir);

module.exports = requestRoutes;
