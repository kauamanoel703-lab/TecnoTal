const express = require('express');
const ctrl = require('../controllers/businessController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const r = express.Router();
r.use(authRequired);

// Produtos — listar: todos; criar/editar/movimentar: quem aprova (gestor/admin)
r.get('/produtos', ctrl.listarProdutos);
r.post('/produtos', requirePermission('solicitacoes.aprovar'), ctrl.criarProduto);
r.put('/produtos/:id', requirePermission('solicitacoes.aprovar'), ctrl.editarProduto);
r.post('/produtos/:id/movimentar', requirePermission('solicitacoes.aprovar'), ctrl.movimentarEstoque);

// Metas
r.get('/metas', ctrl.listarMetas);
r.post('/metas', requirePermission('solicitacoes.aprovar'), ctrl.criarMeta);
r.post('/metas/:id/progresso', ctrl.atualizarProgresso); // qualquer um pode reportar progresso

// Ponto
r.post('/ponto/bater', ctrl.baterPonto);
r.get('/ponto/meu', ctrl.meuPonto);
r.get('/ponto/equipe', requirePermission('relatorios.ver'), ctrl.pontoEquipe);

module.exports = r;
