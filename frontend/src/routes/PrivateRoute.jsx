import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { pode } from '../utils/permissions';

// Exige autenticação
export function PrivateRoute() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="spinner" />;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}

// Exige permissão específica: <RoleRoute permissao="usuarios.criar">...</RoleRoute>
export function RoleRoute({ permissao, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (permissao && !pode(usuario.cargo, permissao)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
