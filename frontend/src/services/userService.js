import api from './api';

export const userService = {
  listar: () => api.get('/users').then((r) => r.data.usuarios),
  criar: (payload) => api.post('/users', payload),
  atualizar: (id, payload) => api.put(`/users/${id}`, payload),
  editarPerfil: (payload) => api.put('/users/perfil/me', payload),
};

export const requestService = {
  minhas: () => api.get('/requests/minhas').then((r) => r.data.solicitacoes),
  todas: () => api.get('/requests').then((r) => r.data.solicitacoes),
  criar: (payload) => api.post('/requests', payload),
  decidir: (id, acao, observacao) =>
    api.post(`/requests/${id}/decidir`, { acao, observacao }),
};

export const reportService = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data),
  atividades: (pagina = 1) =>
    api.get('/reports/atividades', { params: { pagina } }).then((r) => r.data),
};
