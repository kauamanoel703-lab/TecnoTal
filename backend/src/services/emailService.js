// Serviço de e-mail — nodemailer com config no .env.
// Se SMTP não estiver configurado, o sistema cai no modo dev (token na resposta).
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

const smtpAtivo = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (smtpAtivo) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true = 465
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function enviarEmail(para, assunto, html) {
  if (!smtpAtivo) {
    console.log(`[mail] SMTP desativado — e-mail para ${para} não enviado`);
    return false;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Intranet TecnoTal" <${SMTP_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
  return true;
}

function templateRecuperacao(nome, resetUrl, minutos) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;background:#0b0f19;color:#e2e8f0;border-radius:14px;">
    <h2 style="color:#38bdf8;">Intranet TecnoTal</h2>
    <p>Olá, <strong>${nome}</strong>,</p>
    <p>Recebemos um pedido de redefinição de senha. Use o botão abaixo (válido por <strong>${minutos} minutos</strong>, uso único):</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;padding:13px 30px;border-radius:10px;text-decoration:none;font-weight:bold;">
        Redefinir minha senha
      </a>
    </p>
    <p style="font-size:12px;color:#94a3b8;">Se você não solicitou isso, ignore este e-mail — sua senha permanece a mesma.</p>
    <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0;">
    <p style="font-size:11px;color:#64748b;">Se o botão não funcionar, copie e cole no navegador:<br>${resetUrl}</p>
  </div>`;
}

module.exports = { smtpAtivo, enviarEmail, templateRecuperacao };
