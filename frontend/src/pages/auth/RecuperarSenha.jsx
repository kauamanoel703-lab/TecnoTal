import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Tela "Esqueci a senha" — gera token (sem SMTP: token aparece na tela, modo dev)
export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro(''); setMsg(''); setResetUrl('');
    setEnviando(true);
    try {
      const { data } = await api.post('/auth/recuperar', { email });
      setMsg(data.msg || 'Se o e-mail existir, o token foi gerado.');
      if (data.resetUrl) setResetUrl(data.resetUrl); // TODO SMTP: remover quando houver e-mail
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao solicitar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.div className="auth-card card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div className="auth-logo"><span className="gradient-text">TecnoTal</span></div>
        <p className="auth-sub">Recuperar senha</p>

        {msg && (
          <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.35)', color: '#86efac', padding: 11, borderRadius: 10, fontSize: 13 }}>
            {msg}
            {resetUrl && (
              <div style={{ marginTop: 8, wordBreak: 'break-all' }}>
                Modo dev — link direto:{' '}
                <Link to={resetUrl} style={{ color: 'var(--cyan)' }}>Redefinir senha →</Link>
              </div>
            )}
          </div>
        )}
        {erro && <div className="alert-error">{erro}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <button type="submit" className="btn full" disabled={enviando}>{enviando ? 'Enviando…' : 'GERAR TOKEN'}</button>
        </form>
        <Link to="/login" className="auth-link">← Voltar ao login</Link>
      </motion.div>
    </div>
  );
}
