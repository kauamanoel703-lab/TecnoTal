const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const bloqueio = require('../middlewares/bloqueioLogin');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 8 * 60 * 60 * 1000, // 8h
};

async function registrarAtividade(usuarioId, acao, detalhes, ip) {
  await db.execute(
    'INSERT INTO atividades (usuario_id, acao, detalhes, ip) VALUES (?, ?, ?, ?)',
    [usuarioId || null, acao, detalhes || null, ip || null]
  );
}

async function permissoesDoUsuario(cargoId) {
  const [rows] = await db.execute(
    'SELECT p.codigo FROM cargo_permissoes cp JOIN permissoes p ON p.id = cp.permissao_id WHERE cp.cargo_id = ?',
    [cargoId]
  );
  return rows.map((r) => r.codigo);
}

function gerarToken(user, permissoes = []) {
  return jwt.sign(
    { id: user.id, nome: user.nome, cargo: user.cargo_nome, cargoId: user.cargo_id, permissoes },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '8h' }
  );
}

function sanitizar(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    cpf: u.cpf,
    telefone: u.telefone,
    cargo: u.cargo_nome,
    cargoId: u.cargo_id,
    criadoEm: u.created_at || u.criado_em,
  };
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const rawEmail = String(req.body?.email ?? '');
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';
    const email = rawEmail.trim().toLowerCase();
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha' });
    }

    // bloqueio por CONTA (independe de IP/rede)
    const segRestantes = bloqueio.verificar(email);
    if (segRestantes) {
      const min = Math.ceil(segRestantes / 60);
      return res.status(429).json({ erro: `Conta temporariamente bloqueada. Tente em ${min} min.` });
    }

    const [rows] = await db.execute(
      `SELECT u.*, c.nome AS cargo_nome
         FROM usuarios u JOIN cargos c ON c.id = u.cargo_id
        WHERE u.email = ?`,
      [email]
    );
    const user = rows[0];

    // mensagem genérica sempre (anti-enumeração)
    if (!user || !user.ativo) {
      bloqueio.registrarFalha(email);
      await registrarAtividade(null, 'LOGIN_FALHOU', email, req.ip);
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) {
      bloqueio.registrarFalha(email);
      await registrarAtividade(user.id, 'LOGIN_FALHOU', null, req.ip);
      return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
    }

    bloqueio.limpar(email);
    const permissoes = await permissoesDoUsuario(user.cargo_id);
    const token = gerarToken(user, permissoes);
    res.cookie('token', token, COOKIE_OPTS);
    await registrarAtividade(user.id, 'LOGIN', null, req.ip);
    return res.json({ usuario: sanitizar(user) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res, next) {
  try {
    if (req.user) await registrarAtividade(req.user.id, 'LOGOUT', null, req.ip);
    res.clearCookie('token', COOKIE_OPTS);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

// GET /api/auth/me — dados do usuário logado
async function me(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT u.*, c.nome AS cargo_nome
         FROM usuarios u JOIN cargos c ON c.id = u.cargo_id
        WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(401).json({ erro: 'Sessão inválida' });
    return res.json({ usuario: sanitizar(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, me, registrarAtividade };
