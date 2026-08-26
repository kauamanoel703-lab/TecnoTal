import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NaoEncontrada() {
  return (
    <div className="auth-page">
      <motion.div className="auth-card card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="gradient-text" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>404</div>
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
            Esta página não existe ou foi movida.
          </p>
        </div>
        <Link to="/" className="btn full" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          Voltar ao Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
