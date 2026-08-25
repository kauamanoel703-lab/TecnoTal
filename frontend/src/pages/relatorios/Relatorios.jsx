import { useEffect, useState } from 'react';
import { reportService } from '../../services/userService';

export default function Relatorios() {
  const [data, setData] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [erro, setErro] = useState('');

  useEffect(() => {
    reportService.atividades(pagina).then(setData).catch(() => setErro('Erro ao carregar'));
  }, [pagina]);

  if (erro) return <div className="alert-error">{erro}</div>;
  if (!data) return <div className="spinner" />;

  return (
    <>
      <h1 className="page-title">Relatórios de Atividade</h1>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
          <tbody>
            {data.atividades.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.criado_em).toLocaleString('pt-BR')}</td>
                <td>{a.usuario || '—'}</td>
                <td><b style={{ color: 'var(--cyan)' }}>{a.acao}</b></td>
                <td>{a.detalhes || '—'}</td>
                <td style={{ color: 'var(--muted)' }}>{a.ip || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn ghost" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--muted)' }}>Página {pagina}</span>
          <button className="btn ghost" disabled={data.atividades.length < data.porPagina} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
        </div>
      </div>
    </>
  );
}
