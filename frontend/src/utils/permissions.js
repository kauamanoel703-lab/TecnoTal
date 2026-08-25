// RBAC no frontend — apenas UX (esconder/mostrar). A decisão real é do backend.

export const PERMISSOES = {
  ADMIN: ['*'],
  GESTOR: [
    'dashboard.ver',
    'perfil.editar_proprio',
    'usuarios.listar',
    'solicitacoes.criar_proprias',
    'solicitacoes.aprovar',
    'relatorios.ver',
  ],
  USUARIO: ['dashboard.ver', 'perfil.editar_proprio', 'solicitacoes.criar_proprias'],
};

// Rotas do menu por permissão (usado pelo Sidebar/MobileMenu)
export const MENU_ADMIN = ['admin.configuracoes', 'admin.cargos_permissoes'];

export function pode(cargo, permissao) {
  const lista = PERMISSOES[cargo] || [];
  return lista.includes('*') || lista.includes(permissao);
}
