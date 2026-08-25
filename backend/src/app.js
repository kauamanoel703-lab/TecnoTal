const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

// 404 JSON
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// Tratamento de erros centralizado
app.use(errorMiddleware);

module.exports = app;
