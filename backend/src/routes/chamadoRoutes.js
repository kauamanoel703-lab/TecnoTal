const express = require('express');
const ctrl = require('../controllers/chamadoController');
const authRequired = require('../middlewares/authMiddleware');

const r = express.Router();
r.use(authRequired);

r.post('/', ctrl.abrir);                 // qualquer funcionário abre
r.get('/', ctrl.listar);
r.get('/meus-setores', ctrl.meusSetores);
r.post('/:id/assumir', ctrl.assumir);
r.post('/:id/resolver', ctrl.resolver);

module.exports = r;
