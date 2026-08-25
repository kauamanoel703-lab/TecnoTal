import { Route, Routes, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from './PrivateRoute';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import MeuPerfil from '../pages/perfil/MeuPerfil';
import MinhasSolicitacoes from '../pages/solicitacoes/MinhasSolicitacoes';
import AprovacaoSolicitacoes from '../pages/solicitacoes/AprovacaoSolicitacoes';
import Usuarios from '../pages/usuarios/Usuarios';
import Relatorios from '../pages/relatorios/Relatorios';
import { IntranetLayout } from '../layouts/IntranetLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<IntranetLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfil" element={<MeuPerfil />} />
          <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
          <Route
            path="/aprovacoes"
            element={
              <RoleRoute permissao="solicitacoes.aprovar">
                <AprovacaoSolicitacoes />
              </RoleRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RoleRoute permissao="usuarios.listar">
                <Usuarios />
              </RoleRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <RoleRoute permissao="relatorios.ver">
                <Relatorios />
              </RoleRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
