import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Redefine a senha com o token recebido (uso único, expira em 30 min)
export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem');
    setEnviando(true);
    try {
      await api.post('/auth/redefinir', { token, novaSenha });
      alert('Senha redefinida! Faça login com a nova senha.');
      navigate('/login');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao redefinir');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.div className="auth-card card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div className="auth-logo"><span className="gradient-text">TecnoTal</span></div>
        <p className="auth-sub">Redefinir senha</p>

        {erro && <div className="alert-error">{erro}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Token</label>
            <input className="input" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Nova senha (8 caracteres, letra + número + especial)</label>
            <input type="password" className="input" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Confirmar nova senha</label>
            <input type="password" className="input" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
          </div>
          <button type="submit" className="btn full" disabled={enviando}>{enviando ? 'Salvando…' : 'REDEFINIR SENHA'}</button>
        </form>
        <Link to="/login" className="auth-link">← Voltar ao login</Link>
      </motion.div>
    </div>
  );
}
