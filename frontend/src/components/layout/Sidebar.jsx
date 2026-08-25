import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CheckSquare, Users, BarChart3,
  Settings, ShieldCheck, Package, Target, Clock, Banknote, TrendingUp, LifeBuoy,
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
      <NavLink to="/ponto" className={item}><Clock size={17}/> Ponto</NavLink>
      <NavLink to="/chamados" className={item}><LifeBuoy size={17}/> Chamados</NavLink>
      <NavLink to="/produtos" className={item}><Package size={17}/> Produtos</NavLink>
      <NavLink to="/metas" className={item}><Target size={17}/> Metas</NavLink>
      <NavLink to="/solicitacoes" className={item}><ClipboardList size={17}/> Minhas Solicitações</NavLink>
      {can('solicitacoes.aprovar') && (
        <NavLink to="/aprovacoes" className={item}><CheckSquare size={17}/> Aprovações</NavLink>
      )}
      {can('usuarios.listar') && (
        <NavLink to="/usuarios" className={item}><Users size={17}/> Usuários</NavLink>
      )}
      {can('relatorios.ver') && (
        <>
          <NavLink to="/financeiro" className={item}><TrendingUp size={17}/> Financeiro</NavLink>
          <NavLink to="/salarios" className={item}><Banknote size={17}/> Salários</NavLink>
          <NavLink to="/relatorios" className={item}><BarChart3 size={17}/> Relatórios</NavLink>
        </>
      )}

      {can('admin.configuracoes') && (
        <>
          <div style={{ margin: '14px 12px 6px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#64748b' }}>Administração</div>
          {can('admin.configuracoes') && (
            <NavLink to="/admin/configuracoes" className={item}><Settings size={17}/> Configurações</NavLink>
          )}
          {can('admin.cargos_permissoes') && (
            <NavLink to="/admin/cargos" className={item}><ShieldCheck size={17}/> Cargos e Permissões</NavLink>
          )}
        </>
      )}
    </aside>
  );
}
