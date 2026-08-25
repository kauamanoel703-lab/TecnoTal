const express = require('express');
const controller = require('../controllers/exportController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const r = express.Router();
r.use(authRequired);
r.use(requirePermission('relatorios.ver'));

r.get('/atividades.csv', controller.exportarAtividades);
r.get('/usuarios.csv', requirePermission('usuarios.listar'), controller.exportarUsuarios);
r.get('/solicitacoes.csv', requirePermission('solicitacoes.aprovar'), controller.exportarSolicitacoes);

module.exports = r;
