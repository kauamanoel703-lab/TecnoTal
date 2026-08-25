import api from './api';

export const businessService = {
  // produtos
  listarProdutos: () => api.get('/business/produtos').then((r) => r.data.produtos),
  criarProduto: (p) => api.post('/business/produtos', p),
  editarProduto: (id, p) => api.put(`/business/produtos/${id}`, p),
  movimentarEstoque: (id, tipo, quantidade, observacao) =>
    api.post(`/business/produtos/${id}/movimentar`, { tipo, quantidade, observacao }),
  // metas
  listarMetas: () => api.get('/business/metas').then((r) => r.data.metas),
  criarMeta: (m) => api.post('/business/metas', m),
  atualizarProgresso: (id, body) => api.post(`/business/metas/${id}/progresso`, body),
  // ponto
  baterPonto: () => api.post('/business/ponto/bater').then((r) => r.data),
  meuPonto: () => api.get('/business/ponto/meu').then((r) => r.data.registros),
  pontoEquipe: (data) => api.get('/business/ponto/equipe', { params: { data } }).then((r) => r.data.funcionarios),
};

export const salarioService = {
  listar: () => api.get('/salarios').then((r) => r.data),
  definir: (usuarioId, valorMensal, diaPagamento) =>
    api.put(`/salarios/${usuarioId}`, { valorMensal, diaPagamento }),
  pagar: (usuarioId, opts = {}) => api.post(`/salarios/${usuarioId}/pagar`, opts),
  historico: () => api.get('/salarios/historico').then((r) => r.data),
  meu: () => api.get('/salarios/meu').then((r) => r.data),
};
