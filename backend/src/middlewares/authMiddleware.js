const jwt = require('jsonwebtoken');

// Verifica o JWT do cookie HttpOnly e anexa req.user
function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada' });
  }
}

module.exports = authRequired;
