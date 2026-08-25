const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');
const emailService = require('../services/emailService');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173';
const MINUTOS = 30;

// POST /api/auth/recuperar — gera token de uso único
// Com SMTP: envia o link por e-mail (resposta genérica, sem token).
// Sem SMTP (dev): devolve o token/resetUrl na resposta para testar.
async function solicitarRecuperacao(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ erro: 'Informe o e-mail' });

    const [rows] = await db.execute(
      'SELECT id, nome FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );

    // resposta genérica mesmo se não existir (anti-enumeração)
    if (!rows[0]) {
      return res.json({ ok: true, msg: 'Se o e-mail existir, o link foi enviado.' });
    }

    const usuario = rows[0];
    // invalida tokens antigos
    await db.execute(
      'UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0',
      [usuario.id]
    );

    const token = crypto.randomBytes(24).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await db.execute(
      `INSERT INTO password_resets (usuario_id, token_hash, expira_em)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${MINUTOS} MINUTE))`,
      [usuario.id, hash]
    );
    await registrarAtividade(usuario.id, 'SOLICITAR_RECUPERACAO', null, req.ip);

    const resetUrl = `${FRONT_URL}/redefinir?token=${token}`;

    if (emailService.smtpAtivo) {
      try {
        await emailService.enviarEmail(
          email,
          'Redefinição de senha — Intranet TecnoTal',
          emailService.templateRecuperacao(usuario.nome, resetUrl, MINUTOS)
        );
        return res.json({ ok: true, msg: `Enviamos um link de redefinição para ${email}. Verifique a caixa de entrada.` });
      } catch (mailErr) {
        console.error('[mail] falha ao enviar:', mailErr.message);
        // não vaza o token mesmo se o e-mail falhar; usuário pode tentar de novo
        return res.status(502).json({ erro: 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.' });
      }
    }

    // modo DEV sem SMTP
    return res.json({
      ok: true,
      msg: `[DEV sem SMTP] Token gerado. Válido por ${MINUTOS} minutos.`,
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

    // segurança: notifica o dono da conta que a senha mudou
    const [[user]] = await db.execute('SELECT email FROM usuarios WHERE id = ?', [rows[0].usuario_id]);
    if (emailService.smtpAtivo && user?.email) {
      emailService.enviarEmail(
        user.email,
        'Senha alterada — Intranet TecnoTal',
        `<p>Sua senha foi alterada agora pouco. Se não foi você, contate o administrador imediatamente.</p>`
      ).catch(() => {});
    }

    await registrarAtividade(rows[0].usuario_id, 'REDEFINIR_SENHA', null, req.ip);
    return res.json({ ok: true, msg: 'Senha redefinida com sucesso' });
  } catch (err) { next(err); }
}

module.exports = { solicitarRecuperacao, redefinirSenha };
