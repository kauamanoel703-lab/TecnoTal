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
  definir: (usuarioId, valorMensal, diaPagamento, nivel, departamento) =>
    api.put(`/salarios/${usuarioId}`, { valorMensal, diaPagamento, nivel, departamento }),
  pagar: (usuarioId, opts = {}) => api.post(`/salarios/${usuarioId}/pagar`, opts),
  historico: () => api.get('/salarios/historico').then((r) => r.data),
  meu: () => api.get('/salarios/meu').then((r) => r.data),
};

export const financeiroService = {
  resumo: () => api.get('/business/financeiro/resumo').then((r) => r.data),
  ultimasVendas: () => api.get('/business/financeiro/ultimas-vendas').then((r) => r.data.vendas),
  registrarVenda: (produtoId, quantidade, precoUnitario, observacao) =>
    api.post('/business/vendas', { produtoId, quantidade, precoUnitario, observacao }),
};

export const chamadoService = {
  abrir: (departamento, titulo, descricao, prioridade) =>
    api.post('/chamados', { departamento, titulo, descricao, prioridade }),
  listar: (departamento, status) =>
    api.get('/chamados', { params: { departamento, status } }).then((r) => r.data.chamados),
  meusSetores: () => api.get('/chamados/meus-setores').then((r) => r.data.setores),
  assumir: (id) => api.post(`/chamados/${id}/assumir`),
  resolver: (id, resposta) => api.post(`/chamados/${id}/resolver`, { resposta }),
};

export const setoresService = {
  // documentos (administrativo)
  listarDocs: () => api.get('/setores/docs').then((r) => r.data.documentos),
  enviarDocs: (files, titulo, categoria, visivelPara) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('arquivos', f));
    if (titulo) fd.append('titulo', titulo);
    fd.append('categoria', categoria);
    fd.append('visivelPara', visivelPara);
    return api.post('/setores/docs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  baixarDoc: async (id, nome) => {
    const resp = await api.get(`/setores/docs/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.click();
    URL.revokeObjectURL(url);
  },
  excluirDoc: (id) => api.delete(`/setores/docs/${id}`),
  // T.I.
  inventario: () => api.get('/setores/ti/inventario').then((r) => r.data.equipamentos),
  criarEquipamento: (p) => api.post('/setores/ti/inventario', p),
  editarEquipamento: (id, p) => api.put(`/setores/ti/inventario/${id}`, p),
  servidores: () => api.get('/setores/ti/servidores').then((r) => r.data.servidores),
  criarServidor: (p) => api.post('/setores/ti/servidores', p),
  statusServidor: (id, status) => api.patch(`/setores/ti/servidores/${id}/status`, { status }),
  saude: () => api.get('/setores/ti/saude').then((r) => r.data),
};
