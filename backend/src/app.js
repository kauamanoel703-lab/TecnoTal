const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { router: requestRoutes, anexoDownload } = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const businessRoutes = require('./routes/businessRoutes');
const salarioRoutes = require('./routes/salarioRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const exportRoutes = require('./routes/exportRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Segurança
app.use(helmet());
app.use(cors({
  origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate limit global leve + específico no login (ver authRoutes)
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Rotas
app.get('/api/health', (req, res) => res.json({ status: 'ok', sistema: 'Intranet TecnoTal' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificacaoRoutes);
app.use(anexoDownload);
app.use('/api/reports', exportRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/salarios', salarioRoutes);
app.use('/api/business', financeiroRoutes);

// 404 JSON
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// Tratamento de erros centralizado
app.use(errorMiddleware);

module.exports = app;
