const notifRoutes = require('express').Router();
const controller = require('../controllers/notificacaoController');
const authRequired = require('../middlewares/authMiddleware');

notifRoutes.use(authRequired);
notifRoutes.get('/', controller.listar);
notifRoutes.post('/ler-todas', controller.marcarLidas);

module.exports = notifRoutes;
