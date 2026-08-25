import { useEffect, useState } from 'react';
import { requestService } from '../../services/userService';

export default function AprovacaoSolicitacoes() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => requestService.todas().then(setLista).catch(() => setErro('Erro ao carregar'));
  useEffect(() => { carregar(); }, []);

  async function decidir(id, acao) {
    const observacao = prompt(`Observação (${acao}):`) || '';
    try {
      await requestService.decidir(id, acao, observacao);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro');
    }
  }

  return (
    <>
      <h1 className="page-title">Aprovação de Solicitações</h1>
      {erro && <div className="alert-error">{erro}</div>}
      <div className="card table-wrap">
        {!lista ? <div className="spinner" /> : (
          <table className="table">
            <thead><tr><th>#</th><th>Usuário</th><th>Título</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.usuario}</td>
                  <td>{s.titulo}<br /><small style={{ color: 'var(--muted)' }}>{s.descricao}</small></td>
                  <td><span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                  <td>{new Date(s.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {s.status === 'PENDENTE' && (
                      <span style={{ display: 'flex', gap: 8 }}>
                        <button className="btn success" style={{ padding: '6px 12px' }} onClick={() => decidir(s.id, 'aprovar')}>Aprovar</button>
                        <button className="btn danger" style={{ padding: '6px 12px' }} onClick={() => decidir(s.id, 'rejeitar')}>Rejeitar</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Nada por aqui.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
