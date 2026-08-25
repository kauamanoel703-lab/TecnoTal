import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

// Login dark premium: glow seguindo o mouse, inputs iluminados, botão animado
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const glowRef = useRef(null);

  const onMouseMove = (e) => {
    if (glowRef.current) {
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await login(email, senha);
      window.location.href = '/';
    } catch (err) {
      setErro(err.response?.data?.erro || 'E-mail ou senha inválidos');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page" onMouseMove={onMouseMove}>
      <div ref={glowRef} className="auth-glow" style={{ left: '50%', top: '40%' }} />
      <motion.div
        className="auth-card card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5, ease: 'easeOut' }}
      >
        <div className="auth-logo">
          <span className="gradient-text">TecnoTal</span>
        </div>
        <p className="auth-sub">Acesso à Intranet</p>

        {erro && <div className="alert-error">{erro}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email" type="email" className="input" placeholder="seu@email.com.br"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="username" required autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha" type="password" className="input" placeholder="••••••••"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password" required
            />
          </div>
          <motion.button
            type="submit" className="btn full" disabled={enviando}
            whileTap={{ scale: .97 }}
          >
            {enviando ? 'Entrando…' : 'ENTRAR'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
