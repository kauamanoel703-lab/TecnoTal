import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CheckSquare, Users, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';

export default function Sidebar() {
  const { usuario } = useAuth();
  const can = (p) => pode(usuario?.cargo, p);
  const item = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="brand gradient-text">TecnoTal</div>
      <NavLink to="/" end className={item}><LayoutDashboard size={17}/> Dashboard</NavLink>
      <NavLink to="/solicitacoes" className={item}><ClipboardList size={17}/> Minhas Solicitações</NavLink>
      {can('solicitacoes.aprovar') && (
        <NavLink to="/aprovacoes" className={item}><CheckSquare size={17}/> Aprovações</NavLink>
      )}
      {can('usuarios.listar') && (
        <NavLink to="/usuarios" className={item}><Users size={17}/> Usuários</NavLink>
      )}
      {can('relatorios.ver') && (
        <NavLink to="/relatorios" className={item}><BarChart3 size={17}/> Relatórios</NavLink>
      )}
    </aside>
  );
}
