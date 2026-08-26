import { useEffect, useState } from 'react';
import { setoresService } from '../../services/businessService';
import { Server, Monitor, Plus, Activity, HardDrive } from 'lucide-react';

const STATUS_COR = { ONLINE: 'var(--success)', OFFLINE: 'var(--danger)', MANUTENCAO: 'var(--warn)', EM_USO: '#38bdf8', DISPONIVEL: 'var(--success)' };

export default function PainelTI() {
  const [saude, setSaude] = useState(null);
  const [servidores, setServidores] = useState(null);
  const [inventario, setInventario] = useState(null);
  const [aba, setAba] = useState('servidores');
  const [erro, setErro] = useState('');

  // form servidor
  const [srvForm, setSrvForm] = useState({ nome: '', funcao: '', ip: '', sistema: '' });
  // form equipamento
  const [eqForm, setEqForm] = useState({ tipo: 'Notebook', marcaModelo: '', numeroSerie: '' });

  const carregar = () => {
    setoresService.saude().then(setSaude).catch(() => setErro('Erro ao carregar saúde do sistema'));
    setoresService.servidores().then(setServidores).catch(() => {});
    setoresService.inventario().then(setInventario).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  async function criarServidor(e) {
    e.preventDefault();
    try { await setoresService.criarServidor(srvForm); setSrvForm({ nome: '', funcao: '', ip: '', sistema: '' }); carregar(); }
    catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  async function mudarStatus(id, status) {
    try { await setoresService.statusServidor(id, status); carregar(); }
    catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  async function criarEquipamento(e) {
    e.preventDefault();
    try {
      await setoresService.criarEquipamento(eqForm);
      setEqForm({ tipo: 'Notebook', marcaModelo: '', numeroSerie: '' });
      carregar();
    } catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  return (
    <>
      <h1 className="page-title">💻 T.I. — Tecnologia da Informação</h1>

      {/* SAÚDE DA INTRANET */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}><Activity size={15} /> Saúde da Intranet</h3>
          <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={carregar}>Atualizar</button>
        </div>
        {!saude ? <div className="spinner" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(34,197,94,.1)', textAlign: 'center' }}>
              <b style={{ color: 'var(--success)' }}>API ONLINE</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>uptime {saude.api.uptimeMinutos} min · {saude.api.memoriaMb}MB</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(56,189,248,.08)', textAlign: 'center' }}>
              <b style={{ color: 'var(--cyan)' }}>BANCO OK</b>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{saude.banco.latenciaMs}ms · MariaDB {saude.banco.versao}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, textAlign: 'center', background: saude.contadores.servidoresOffline ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.08)' }}>
              <b style={{ color: saude.contadores.servidoresOffline ? 'var(--danger)' : 'var(--success)' }}>
                {saude.contadores.servidoresOffline ? `${saude.contadores.servidoresOffline} servidor(es) OFFLINE` : 'Todos os servidores online'}
              </b>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(148,163,184,.08)', textAlign: 'center' }}>
              <b>{saude.contadores.chamadosAbertos}</b> chamados abertos
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{saude.contadores.usuarios} usuários ativos</div>
            </div>
          </div>
        )}
      </div>

      {/* abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${aba === 'servidores' ? '' : 'ghost'}`} style={{ padding: '8px 16px' }} onClick={() => setAba('servidores')}>
          <Server size={14} /> Servidores
        </button>
        <button className={`btn ${aba === 'inventario' ? '' : 'ghost'}`} style={{ padding: '8px 16px' }} onClick={() => setAba('inventario')}>
          <Monitor size={14} /> Máquinas da empresa
        </button>
      </div>

      {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}

      {/* SERVIDORES */}
      {aba === 'servidores' && (
        <>
          <div className="card table-wrap" style={{ marginBottom: 20 }}>
            {!servidores ? <div className="spinner" /> : servidores.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum servidor cadastrado.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Servidor</th><th>Função</th><th>IP</th><th>Status</th><th>Mudar status</th></tr></thead>
                <tbody>
                  {servidores.map((s) => (
                    <tr key={s.id}>
                      <td><b>{s.nome}</b><br /><small style={{ color: 'var(--muted)' }}>{s.sistema || '—'} · atualizado {s.atualizadoEm}</small></td>
                      <td>{s.funcao}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.ip || '—'}</td>
                      <td><b style={{ color: STATUS_COR[s.status] }}>{s.status}</b></td>
                      <td>
                        <select className="input" style={{ padding: '5px 8px', fontSize: 12 }} value={s.status}
                          onChange={(e) => mudarStatus(s.id, e.target.value)}>
                          <option value="ONLINE">ONLINE</option>
                          <option value="OFFLINE">OFFLINE</option>
                          <option value="MANUTENCAO">MANUTENÇÃO</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ maxWidth: 520 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}><HardDrive size={15} /> Cadastrar servidor</h3>
            <form onSubmit={criarServidor}>
              <div className="form-grid">
                <div className="input-group"><label>Nome *</label>
                  <input className="input" value={srvForm.nome} onChange={(e) => setSrvForm((f) => ({ ...f, nome: e.target.value }))} placeholder="srv-arquivo-01" required /></div>
                <div className="input-group"><label>Função *</label>
                  <input className="input" value={srvForm.funcao} onChange={(e) => setSrvForm((f) => ({ ...f, funcao: e.target.value }))} placeholder="Arquivos" required /></div>
                <div className="input-group"><label>IP</label>
                  <input className="input" value={srvForm.ip} onChange={(e) => setSrvForm((f) => ({ ...f, ip: e.target.value }))} placeholder="192.168.0.10" /></div>
                <div className="input-group"><label>Sistema</label>
                  <input className="input" value={srvForm.sistema} onChange={(e) => setSrvForm((f) => ({ ...f, sistema: e.target.value }))} placeholder="Ubuntu 22.04" /></div>
              </div>
              <button className="btn" style={{ marginTop: 12 }}>Cadastrar</button>
            </form>
          </div>
        </>
      )}

      {/* INVENTÁRIO */}
      {aba === 'inventario' && (
        <>
          <div className="card table-wrap" style={{ marginBottom: 20 }}>
            {!inventario ? <div className="spinner" /> : inventario.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum equipamento cadastrado.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Tipo</th><th>Marca/Modelo</th><th>Nº Série</th><th>Responsável</th><th>Status</th></tr></thead>
                <tbody>
                  {inventario.map((i) => (
                    <tr key={i.id}>
                      <td>{i.tipo}</td>
                      <td>{i.marcaModelo}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.numeroSerie}</td>
                      <td>{i.responsavel}</td>
                      <td><b style={{ color: i.status === 'MANUTENCAO' ? 'var(--warn)' : STATUS_COR[i.status], fontSize: 12 }}>{i.status.replace('_', ' ')}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card" style={{ maxWidth: 520 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Cadastrar máquina/equipamento</h3>
            <form onSubmit={criarEquipamento}>
              <div className="form-grid">
                <div className="input-group"><label>Tipo</label>
                  <select className="input" value={eqForm.tipo} onChange={(e) => setEqForm((f) => ({ ...f, tipo: e.target.value }))}>
                    {['Notebook', 'Desktop', 'Monitor', 'Celular', 'Impressora', 'Roteador', 'Outro'].map((t) => <option key={t}>{t}</option>)}
                  </select></div>
                <div className="input-group"><label>Nº de série *</label>
                  <input className="input" value={eqForm.numeroSerie} onChange={(e) => setEqForm((f) => ({ ...f, numeroSerie: e.target.value.toUpperCase() }))} required /></div>
              </div>
              <div className="input-group" style={{ marginTop: 12 }}><label>Marca/Modelo *</label>
                <input className="input" value={eqForm.marcaModelo} onChange={(e) => setEqForm((f) => ({ ...f, marcaModelo: e.target.value }))} placeholder="Dell Latitude 3420" required /></div>
              <button className="btn" style={{ marginTop: 12 }}>Cadastrar</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
