const express = require('express');
const ctrl = require('../controllers/financeiroController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const r = express.Router();
r.use(authRequired);
r.use(requirePermission('relatorios.ver')); // financeiro é de gestor/admin

r.post('/vendas', ctrl.registrarVenda); // sob /api/business
r.get('/financeiro/resumo', ctrl.resumo);
r.get('/financeiro/ultimas-vendas', ctrl.ultimasVendas);

module.exports = r;
