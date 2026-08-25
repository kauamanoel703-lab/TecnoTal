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

export function pode(cargo, permissao) {
  const lista = PERMISSOES[cargo] || [];
  return lista.includes('*') || lista.includes(permissao);
}

// Máscaras de input
export function maskCpf(v) {
  return String(v || '')
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
}

export function maskTelefone(v) {
  return String(v || '')
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2');
}
