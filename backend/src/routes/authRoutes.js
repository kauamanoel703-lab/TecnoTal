const authRoutes = require('express').Router();
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const authRequired = require('../middlewares/authMiddleware');

// Login: 5 tentativas / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos.' },
});

authRoutes.post('/login', loginLimiter, controller.login);
authRoutes.post('/logout', authRequired, controller.logout);
authRoutes.get('/me', authRequired, controller.me);

module.exports = authRoutes;
