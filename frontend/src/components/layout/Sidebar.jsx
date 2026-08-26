import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CheckSquare, Users, BarChart3,
  Settings, ShieldCheck, Package, Target, Clock, Banknote, TrendingUp, LifeBuoy,
  FileText, Monitor,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';

const Secao = ({ titulo, children }) => (
  <>
    <div className="nav-secao">{titulo}</div>
    {children}
  </>
);

export default function Sidebar() {
  const { usuario } = useAuth();
  const can = (p) => pode(usuario?.cargo, p);
  const item = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="brand gradient-text">TecnoTal</div>

      <Secao titulo="Geral">
        <NavLink to="/" end className={item}><LayoutDashboard size={17}/> Dashboard</NavLink>
        <NavLink to="/ponto" className={item}><Clock size={17}/> Ponto</NavLink>
        <NavLink to="/solicitacoes" className={item}><ClipboardList size={17}/> Solicitações</NavLink>
        <NavLink to="/chamados" className={item}><LifeBuoy size={17}/> Chamados</NavLink>
      </Secao>

      {can('solicitacoes.aprovar') && (
        <Secao titulo="Gestão">
          <NavLink to="/aprovacoes" className={item}><CheckSquare size={17}/> Aprovações</NavLink>
          <NavLink to="/metas" className={item}><Target size={17}/> Metas</NavLink>
        </Secao>
      )}

      {(can('relatorios.ver') || can('usuarios.listar')) && (
        <Secao titulo="Negócio">
          <NavLink to="/produtos" className={item}><Package size={17}/> Produtos</NavLink>
          {can('relatorios.ver') && (
            <>
              <NavLink to="/financeiro" className={item}><TrendingUp size={17}/> Financeiro</NavLink>
              <NavLink to="/administrativo" className={item}><FileText size={17}/> Administrativo</NavLink>
              <NavLink to="/ti" className={item}><Monitor size={17}/> T.I.</NavLink>
            </>
          )}
        </Secao>
      )}

      {can('usuarios.listar') && (
        <Secao titulo="Pessoas">
          <NavLink to="/usuarios" className={item}><Users size={17}/> Usuários</NavLink>
          {can('relatorios.ver') && (
            <NavLink to="/salarios" className={item}><Banknote size={17}/> Salários</NavLink>
          )}
        </Secao>
      )}

      {can('relatorios.ver') && (
        <Secao titulo="Análises">
          <NavLink to="/relatorios" className={item}><BarChart3 size={17}/> Relatórios</NavLink>
        </Secao>
      )}

      {can('admin.configuracoes') && (
        <Secao titulo="Administração">
          <NavLink to="/admin/configuracoes" className={item}><Settings size={17}/> Configurações</NavLink>
          {can('admin.cargos_permissoes') && (
            <NavLink to="/admin/cargos" className={item}><ShieldCheck size={17}/> Cargos</NavLink>
          )}
        </Secao>
      )}
    </aside>
  );
}
