const authRoutes = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const authRequired = require('../middlewares/authMiddleware');

// Login: 5 tentativas / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_IP_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
});

authRoutes.post('/login', loginLimiter, controller.login);
authRoutes.post('/logout', authRequired, controller.logout);
authRoutes.get('/me', authRequired, controller.me);

// Recuperação de senha (sem rate limit do login, mas com o global de /api)
const recuperacao = require('../controllers/recuperacaoController');
authRoutes.post('/recuperar', recuperacao.solicitarRecuperacao);
authRoutes.post('/redefinir', recuperacao.redefinirSenha);

module.exports = authRoutes;
