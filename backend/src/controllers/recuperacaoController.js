const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

// POST /api/auth/recuperar — gera token de uso único (30 min)
// Sem SMTP: o token volta na resposta (modo dev). Em produção, enviar por e-mail.
async function solicitarRecuperacao(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ erro: 'Informe o e-mail' });

    const [rows] = await db.execute(
      'SELECT id FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );

    // resposta genérica mesmo se não existir (anti-enumeração)
    if (!rows[0]) {
      return res.json({ ok: true, msg: 'Se o e-mail existir, o token foi gerado.' });
    }

    const usuarioId = rows[0].id;
    // invalida tokens antigos
    await db.execute(
      'UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0',
      [usuarioId]
    );

    const token = crypto.randomBytes(24).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await db.execute(
      `INSERT INTO password_resets (usuario_id, token_hash, expira_em)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [usuarioId, hash]
    );
    await registrarAtividade(usuarioId, 'SOLICITAR_RECUPERACAO', null, req.ip);

    return res.json({
      ok: true,
      msg: 'Token gerado. Válido por 30 minutos.',
      // TODO SMTP: remover da resposta quando houver e-mail
      token,
      resetUrl: `/redefinir?token=${token}`,
    });
  } catch (err) { next(err); }
}

// POST /api/auth/redefinir — valida token e troca a senha
async function redefinirSenha(req, res, next) {
  try {
    const { token, novaSenha } = req.body || {};
    if (!token || !novaSenha) return res.status(400).json({ erro: 'Token e nova senha obrigatórios' });

    // política de senha
    if (
      novaSenha.length !== 8 ||
      !/[a-zA-Z]/.test(novaSenha) ||
      !/\d/.test(novaSenha) ||
      !/[^a-zA-Z0-9]/.test(novaSenha)
    ) {
      return res.status(400).json({ erro: 'A senha deve ter exatamente 8 caracteres com letra, número e caractere especial' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.execute(
      `SELECT pr.id, pr.usuario_id
         FROM password_resets pr
        WHERE pr.token_hash = ? AND pr.usado = 0 AND pr.expira_em > NOW()`,
      [hash]
    );
    if (!rows[0]) {
      return res.status(400).json({ erro: 'Token inválido ou expirado' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, rows[0].usuario_id]);
    await db.execute('UPDATE password_resets SET usado = 1 WHERE id = ?', [rows[0].id]);
    await registrarAtividade(rows[0].usuario_id, 'REDEFINIR_SENHA', null, req.ip);

    return res.json({ ok: true, msg: 'Senha redefinida com sucesso' });
  } catch (err) { next(err); }
}

module.exports = { solicitarRecuperacao, redefinirSenha };
