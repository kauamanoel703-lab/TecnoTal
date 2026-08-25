import { useEffect, useMemo, useState } from 'react';
import { userService } from '../../services/userService';
import { maskCpf, maskTelefone } from '../../utils/masks';
import EditarUsuarioModal from '../../components/users/EditarUsuarioModal';

const CARGOS = [{ id: 1, nome: 'ADMIN' }, { id: 2, nome: 'GESTOR' }, { id: 3, nome: 'USUARIO' }, { id: 4, nome: 'RH' }];

export default function Usuarios() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '', senha: '', cargoId: 3 });
  const [msg, setMsg] = useState('');

  // filtros
  const [busca, setBusca] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // edição
  const [editando, setEditando] = useState(null);

  const carregar = () => userService.listar().then(setLista).catch(() => setErro('Erro ao carregar'));
  useEffect(() => { carregar(); }, []);

  // busca por nome/email/CPF + filtros de cargo e status (no cliente — volume é pequeno)
  const filtrada = useMemo(() => {
    if (!lista) return [];
    const q = busca.trim().toLowerCase();
    return lista.filter((u) => {
      const bateBusca = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.cpf || '').includes(q.replace(/\D/g, ''));
      const bateCargo = !filtroCargo || String(u.cargoId || u.cargo_id) === filtroCargo;
      const bateStatus = !filtroStatus
        || (filtroStatus === 'ativo' && u.ativo)
        || (filtroStatus === 'inativo' && !u.ativo);
      return bateBusca && bateCargo && bateStatus;
    });
  }, [lista, busca, filtroCargo, filtroStatus]);

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
          <h3 style={{ marginBottom: 6, fontSize: 15 }}>Novo usuário</h3>
          <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 10 }}>
            ⚠️ Definir/trocar cargo é exclusivo de <b style={{ color: 'var(--cyan)' }}>ADMIN</b> e <b style={{ color: 'var(--cyan)' }}>RH</b>.
          </p>
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
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Usuários ({filtrada.length}{lista ? ` de ${lista.length}` : ''})</h3>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <input
              className="input" style={{ flex: 2, minWidth: 140, padding: '9px 12px' }}
              placeholder="🔍 Buscar nome, e-mail ou CPF…"
              value={busca} onChange={(e) => setBusca(e.target.value)}
            />
            <select className="input" style={{ flex: 1, minWidth: 100, padding: '9px 12px' }} value={filtroCargo} onChange={(e) => setFiltroCargo(e.target.value)}>
              <option value="">Todos cargos</option>
              {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select className="input" style={{ flex: 1, minWidth: 100, padding: '9px 12px' }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="">Todos status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {!lista ? <div className="spinner" /> : (
            <table className="table">
              <thead><tr><th>Nome</th><th>Cargo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {filtrada.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}<br /><small style={{ color: 'var(--muted)' }}>{u.email}</small></td>
                    <td>{u.cargo}</td>
                    <td>{u.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditando(u)}>Editar</button>
                        <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => alternarAtivo(u)}>
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrada.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Nenhum usuário encontrado com esses filtros.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSalvo={() => { setEditando(null); setMsg('Usuário atualizado'); carregar(); }}
        />
      )}
    </>
  );
}
