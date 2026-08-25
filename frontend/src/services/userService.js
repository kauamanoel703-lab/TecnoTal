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
  listarAnexos: (id) => api.get(`/requests/${id}/anexos`).then((r) => r.data.anexos),
  enviarAnexos: (id, files) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('anexos', f));
    return api.post(`/requests/${id}/anexos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  baixarAnexo: async (anexoId, nomeOriginal) => {
    const resp = await api.get(`/anexos/${anexoId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeOriginal;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const reportService = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data),
  atividades: (pagina = 1) =>
    api.get('/reports/atividades', { params: { pagina } }).then((r) => r.data),
};
