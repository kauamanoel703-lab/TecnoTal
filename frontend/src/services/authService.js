import api from './api';

export const authService = {
  async login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    return data.usuario;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.usuario;
  },
};
