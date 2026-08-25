import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ onMenu }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const sair = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn ghost" style={{ padding: '8px 10px' }} onClick={onMenu} id="btn-menu-mobile">☰</button>
        <span className="gradient-text" style={{ fontWeight: 700, fontSize: 16 }}>Intranet TecnoTal</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          className="glow-hover"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}
          onClick={() => navigate('/perfil')}
        >
          <User size={16} /> {usuario?.nome}
        </span>
        <button className="btn ghost" onClick={sair} style={{ padding: '8px 12px' }} title="Sair">
          <LogOut size={15} /> Sair
        </button>
      </div>
    </header>
  );
}
