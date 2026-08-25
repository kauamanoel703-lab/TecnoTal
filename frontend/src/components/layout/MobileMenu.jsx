import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, ClipboardList, CheckSquare, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';

export default function MobileMenu({ onClose }) {
  const { usuario } = useAuth();
  const can = (p) => pode(usuario?.cargo, p);
  const item = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(11,15,25,.97)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', padding: 24, gap: 4,
    }}>
      <button className="btn ghost" onClick={onClose} style={{ alignSelf: 'flex-end', padding: '8px 10px' }}>
        <X size={18} />
      </button>
      <div className="brand gradient-text" style={{ fontSize: 24, marginBottom: 10 }}>TecnoTal</div>
      <NavLink to="/" end onClick={onClose} className={item}><LayoutDashboard size={17}/> Dashboard</NavLink>
      <NavLink to="/solicitacoes" onClick={onClose} className={item}><ClipboardList size={17}/> Minhas Solicitações</NavLink>
      {can('solicitacoes.aprovar') && (
        <NavLink to="/aprovacoes" onClick={onClose} className={item}><CheckSquare size={17}/> Aprovações</NavLink>
      )}
      {can('usuarios.listar') && (
        <NavLink to="/usuarios" onClick={onClose} className={item}><Users size={17}/> Usuários</NavLink>
      )}
      {can('relatorios.ver') && (
        <NavLink to="/relatorios" onClick={onClose} className={item}><BarChart3 size={17}/> Relatórios</NavLink>
      )}
    </div>
  );
}
