import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { maskCpf, maskTelefone } from '../../utils/masks';

const CARGOS = [{ id: 1, nome: 'ADMIN' }, { id: 2, nome: 'GESTOR' }, { id: 3, nome: 'USUARIO' }];

export default function Usuarios() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '', senha: '', cargoId: 3 });
  const [msg, setMsg] = useState('');

  const carregar = () => userService.listar().then(setLista).catch(() => setErro('Erro ao carregar'));
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro(''); setMsg('');
    try {
      await userService.criar(form);
      setMsg(`Usuário ${form.nome} criado`);
      setForm({ nome: '', email: '', cpf: '', telefone: '', senha: '', cargoId: 3 });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar');
    }
  }

  async function alternarAtivo(u) {
    try {
      await userService.atualizar(u.id, { ativo: !u.ativo });
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro');
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <h1 className="page-title">Usuários</h1>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Novo usuário</h3>
          {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}
          <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="input-group"><label>Nome</label>
              <input className="input" value={form.nome} onChange={set('nome')} required /></div>
            <div className="input-group"><label>E-mail</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required /></div>
            <div className="form-grid">
              <div className="input-group"><label>CPF</label>
                <input className="input" value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))} placeholder="000.000.000-00" required /></div>
              <div className="input-group"><label>Telefone</label>
                <input className="input" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="form-grid">
              <div className="input-group"><label>Senha</label>
                <input type="password" className="input" value={form.senha} onChange={set('senha')} placeholder="8+ c/ letra, número e especial" required /></div>
              <div className="input-group"><label>Cargo</label>
                <select className="input" value={form.cargoId} onChange={(e) => setForm((f) => ({ ...f, cargoId: Number(e.target.value) }))}>
                  {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select></div>
            </div>
            <button className="btn">Criar usuário</button>
          </form>
        </div>

        <div className="card table-wrap">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Todos os usuários</h3>
          {!lista ? <div className="spinner" /> : (
            <table className="table">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}<br /><small style={{ color: 'var(--muted)' }}>{u.email}</small></td>
                    <td>{u.cargo}</td>
                    <td>{u.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td>
                      <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => alternarAtivo(u)}>
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
