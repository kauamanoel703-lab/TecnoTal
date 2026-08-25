const express = require('express');
const ctrl = require('../controllers/salarioController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const r = express.Router();
r.use(authRequired);

// gestão (admin/gestor)
r.get('/', requirePermission('solicitacoes.aprovar'), ctrl.listar);
r.put('/:usuarioId', requirePermission('admin.configuracoes'), ctrl.definir); // só ADMIN define valor
r.post('/:usuarioId/pagar', requirePermission('solicitacoes.aprovar'), ctrl.pagar);
r.get('/historico', requirePermission('relatorios.ver'), ctrl.historico);

// próprio funcionário
r.get('/meu', ctrl.meu);

module.exports = r;
