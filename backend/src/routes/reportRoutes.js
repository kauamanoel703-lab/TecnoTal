const reportRoutes = require('express').Router();
const controller = require('../controllers/reportController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

reportRoutes.use(authRequired);
reportRoutes.get('/dashboard', requirePermission('dashboard.ver'), controller.dashboard);
reportRoutes.get('/atividades', requirePermission('relatorios.ver'), controller.atividades);

module.exports = reportRoutes;
