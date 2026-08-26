import { Route, Routes, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from './PrivateRoute';
import Login from '../pages/auth/Login';
import RecuperarSenha from '../pages/auth/RecuperarSenha';
import RedefinirSenha from '../pages/auth/RedefinirSenha';
import Dashboard from '../pages/dashboard/Dashboard';
import MeuPerfil from '../pages/perfil/MeuPerfil';
import MinhasSolicitacoes from '../pages/solicitacoes/MinhasSolicitacoes';
import AprovacaoSolicitacoes from '../pages/solicitacoes/AprovacaoSolicitacoes';
import Usuarios from '../pages/usuarios/Usuarios';
import Relatorios from '../pages/relatorios/Relatorios';
import Configuracoes from '../pages/admin/Configuracoes';
import CargosPermissoes from '../pages/admin/CargosPermissoes';
import Produtos from '../pages/business/Produtos';
import Metas from '../pages/business/Metas';
import Ponto from '../pages/business/Ponto';
import Salarios from '../pages/business/Salarios';
import Financeiro from '../pages/business/Financeiro';
import Chamados from '../pages/business/Chamados';
import NaoEncontrada from '../pages/NaoEncontrada';
import Administrativo from '../pages/business/Administrativo';
import PainelTI from '../pages/business/PainelTI';
import { IntranetLayout } from '../layouts/IntranetLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarSenha />} />
      <Route path="/redefinir" element={<RedefinirSenha />} />

      <Route element={<PrivateRoute />}>
        <Route element={<IntranetLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfil" element={<MeuPerfil />} />
          <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/ponto" element={<Ponto />} />
          <Route path="/chamados" element={<Chamados />} />
          <Route
            path="/administrativo"
            element={
              <RoleRoute permissao="relatorios.ver">
                <Administrativo />
              </RoleRoute>
            }
          />
          <Route
            path="/ti"
            element={
              <RoleRoute permissao="relatorios.ver">
                <PainelTI />
              </RoleRoute>
            }
          />
          <Route
            path="/salarios"
            element={
              <RoleRoute permissao="relatorios.ver">
                <Salarios />
              </RoleRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <RoleRoute permissao="relatorios.ver">
                <Financeiro />
              </RoleRoute>
            }
          />
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
          <Route
            path="/admin/configuracoes"
            element={
              <RoleRoute permissao="admin.configuracoes">
                <Configuracoes />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/cargos"
            element={
              <RoleRoute permissao="admin.cargos_permissoes">
                <CargosPermissoes />
              </RoleRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
