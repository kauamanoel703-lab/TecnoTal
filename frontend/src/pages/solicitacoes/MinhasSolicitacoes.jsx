import { useEffect, useState } from 'react';
import { requestService } from '../../services/userService';

export default function MinhasSolicitacoes() {
  const [lista, setLista] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  const carregar = () => requestService.minhas().then(setLista).catch(() => setErro('Erro ao carregar'));
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro('');
    try {
      await requestService.criar({ titulo, descricao });
      setTitulo(''); setDescricao('');
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar solicitação');
    }
  }

  return (
    <>
      <h1 className="page-title">Minhas Solicitações</h1>
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Nova solicitação</h3>
          {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}
          <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label>Título</label>
              <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={3} />
            </div>
            <div className="input-group">
              <label>Descrição</label>
              <textarea className="input" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <button className="btn">Enviar</button>
          </form>
        </div>

        <div className="card table-wrap">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Histórico</h3>
          {!lista ? <div className="spinner" /> : (
            <table className="table">
              <thead><tr><th>Título</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.id}>
                    <td>{s.titulo}</td>
                    <td><span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                    <td>{new Date(s.criado_em).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Nenhuma solicitação.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
