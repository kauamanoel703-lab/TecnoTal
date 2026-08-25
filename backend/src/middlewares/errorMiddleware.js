// Nunca vaza stack trace ao cliente; loga no servidor.
module.exports = (err, req, res, next) => {
  console.error('[erro]', err.message);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({
    erro: status === 500 ? 'Erro interno do servidor' : err.message,
  });
};
