const express = require('express');
const ctrl = require('../controllers/dashboardController');
const authRequired = require('../middlewares/authMiddleware');

const r = express.Router();
r.use(authRequired);
r.get('/dashboard/resumo', ctrl.resumo);

module.exports = r;
