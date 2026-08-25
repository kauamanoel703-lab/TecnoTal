import { useEffect, useState } from 'react';
import { reportService } from '../../services/userService';
import api from '../../services/api';
import { Download } from 'lucide-react';

function BotaoExportar({ rota, children }) {
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      const resp = await api.get(rota, { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a');
      const cd = resp.headers['content-disposition'] || '';
      a.href = url;
      a.download = cd.match(/filename="?([^"]+)"?/)?.[1] || `${rota.replace(/\W/g, '')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao exportar');
    } finally {
      setBaixando(false);
    }
  }

  return (
    <button className="btn ghost" style={{ padding: '7px 14px', fontSize: 12 }} onClick={baixar} disabled={baixando}>
      <Download size={14} /> {baixando ? 'Gerando…' : children}
    </button>
  );
}

export default function Relatorios() {
  const [data, setData] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    reportService.atividades(pagina).then(setData).catch(() => setErro('Erro ao carregar'));
  }, [pagina]);

  if (erro) return <div className="alert-error">{erro}</div>;
  if (!data) return <div className="spinner" />;

  const filtradas = data.atividades.filter((a) =>
    !busca ||
    (a.usuario || '').toLowerCase().includes(busca.toLowerCase()) ||
    a.acao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Relatórios de Atividade</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <BotaoExportar rota="/reports/atividades.csv">Atividades CSV</BotaoExportar>
          <BotaoExportar rota="/reports/solicitacoes.csv">Solicitações CSV</BotaoExportar>
          <BotaoExportar rota="/reports/usuarios.csv">Usuários CSV</BotaoExportar>
        </div>
      </div>

      <input
        className="input" style={{ maxWidth: 320, padding: '10px 14px', marginBottom: 16 }}
        placeholder="🔍 Filtrar por usuário ou ação…"
        value={busca} onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
          <tbody>
            {filtradas.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.criado_em).toLocaleString('pt-BR')}</td>
                <td>{a.usuario || '—'}</td>
                <td><b style={{ color: 'var(--cyan)' }}>{a.acao}</b></td>
                <td>{a.detalhes || '—'}</td>
                <td style={{ color: 'var(--muted)' }}>{a.ip || '—'}</td>
              </tr>
            ))}
            {filtradas.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Nada encontrado.</td></tr>}
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
