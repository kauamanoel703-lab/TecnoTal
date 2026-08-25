import { useEffect, useState } from 'react';
import { chamadoService } from '../../services/businessService';
import { LifeBuoy, Wrench, CheckCircle2, Plus, X } from 'lucide-react';

const DEPTOS = [
  { id: 'RH', nome: 'RH', cor: '#a78bfa', icone: '👥' },
  { id: 'TI', nome: 'T.I.', cor: '#38bdf8', icone: '💻' },
  { id: 'ADMINISTRATIVO', nome: 'Administrativo', cor: '#f59e0b', icone: '🏢' },
];
const STATUS_COR = { ABERTO: 'var(--danger)', EM_ATENDIMENTO: 'var(--warn)', RESOLVIDO: 'var(--success)' };

export default function Chamados() {
  const [lista, setLista] = useState(null);
  const [setores, setSetores] = useState([]);
  const [filtroDepto, setFiltroDepto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [erro, setErro] = useState('');

  // novo chamado
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ departamento: 'TI', titulo: '', descricao: '', prioridade: 'MEDIA' });

  // resolver
  const [resolvendo, setResolvendo] = useState(null); // chamado id
  const [textoResposta, setTextoResposta] = useState('');

  const carregar = () =>
    chamadoService.listar(filtroDepto || undefined, filtroStatus || undefined)
      .then(setLista).catch(() => setErro('Erro ao carregar chamados'));
  useEffect(() => { carregar(); }, [filtroDepto, filtroStatus]);
  useEffect(() => { chamadoService.meusSetores().then(setSetores).catch(() => {}); }, []);

  async function abrirChamado(e) {
    e.preventDefault();
    setErro('');
    try {
      await chamadoService.abrir(form.departamento, form.titulo, form.descricao, form.prioridade);
      setModalAberto(false);
      setForm({ departamento: 'TI', titulo: '', descricao: '', prioridade: 'MEDIA' });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao abrir chamado');
    }
  }

  async function assumir(id) {
    try { await chamadoService.assumir(id); carregar(); }
    catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  async function resolver() {
    try {
      await chamadoService.resolver(resolvendo, textoResposta);
      setResolvendo(null); setTextoResposta('');
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro');
    }
  }

  const podeAtender = (c) => setores.includes(c.departamento) && c.status !== 'RESOLVIDO';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>🎫 Chamados Internos</h1>
        <button className="btn" onClick={() => setModalAberto(true)}><Plus size={15} /> Abrir chamado</button>
      </div>

      {/* filas por departamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 18 }}>
        {DEPTOS.map((d) => {
          const abertos = (lista || []).filter((c) => c.departamento === d.id && c.status !== 'RESOLVIDO').length;
          const minhaFila = setores.includes(d.id);
          return (
            <div key={d.id} className="card" style={{
              padding: 14, cursor: 'pointer',
              border: filtroDepto === d.id ? `1px solid ${d.cor}` : '1px solid var(--glass-border)',
            }} onClick={() => setFiltroDepto(filtroDepto === d.id ? '' : d.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20 }}>{d.icone}</span>
                {minhaFila && <LifeBuoy size={15} color={d.cor} title="Você atende este setor" />}
              </div>
              <b style={{ fontSize: 14 }}>{d.nome}</b>
              <div style={{ fontSize: 12, color: abertos ? d.cor : 'var(--muted)' }}>
                {abertos} aberto{abertos === 1 ? '' : 's'}
              </div>
            </div>
          );
        })}
        {filtroStatus && (
          <div className="card" style={{ padding: 14 }} onClick={() => setFiltroStatus('')}>
            <X size={16} /> limpar status: {filtroStatus}
          </div>
        )}
      </div>

      {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}

      {/* lista */}
      {!lista ? <div className="spinner" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>#</th><th>Setor</th><th>Título</th><th>Prioridade</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{DEPTOS.find((d) => d.id === c.departamento)?.icone} {c.departamento}</td>
                  <td>
                    {c.titulo}
                    {c.descricao && <><br /><small style={{ color: 'var(--muted)' }}>{c.descricao.slice(0, 70)}</small></>}
                    <br /><small style={{ color: 'var(--muted)' }}>por {c.abertoPor} · {c.abertoEm}{c.atendidoPor !== '—' ? ` · atendendo: ${c.atendidoPor}` : ''}</small>
                    {c.resposta && <><br /><small style={{ color: 'var(--success)' }}>↳ {c.resposta}</small></>}
                  </td>
                  <td>
                    <b style={{ color: c.prioridade === 'ALTA' ? 'var(--danger)' : c.prioridade === 'BAIXA' ? 'var(--muted)' : 'var(--warn)', fontSize: 12 }}>{c.prioridade}</b>
                  </td>
                  <td><b style={{ color: STATUS_COR[c.status], fontSize: 12 }}>{c.status.replace('_', ' ')}</b></td>
                  <td>
                    {podeAtender(c) && c.status === 'ABERTO' && (
                      <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => assumir(c.id)}><Wrench size={13} /> Assumir</button>
                    )}
                    {podeAtender(c) && c.status === 'EM_ATENDIMENTO' && (
                      <button className="btn success" style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => { setResolvendo(c.id); setTextoResposta(''); }}>Resolver</button>
                    )}
                    {c.status === 'RESOLVIDO' && <CheckCircle2 size={15} color="var(--success)" />}
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Nenhum chamado com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal abrir */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModalAberto(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16 }}>Abrir chamado</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModalAberto(false)} />
            </div>
            <form onSubmit={abrirChamado} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group"><label>Departamento *</label>
                <select className="input" value={form.departamento} onChange={(e) => setForm((f) => ({ ...f, departamento: e.target.value }))}>
                  {DEPTOS.map((d) => <option key={d.id} value={d.id}>{d.icone} {d.nome}</option>)}
                </select></div>
              <div className="input-group"><label>Título *</label>
                <input className="input" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} required minLength={3} /></div>
              <div className="input-group"><label>Descrição</label>
                <textarea className="input" rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="input-group"><label>Prioridade</label>
                <select className="input" value={form.prioridade} onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}>
                  <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option>
                </select></div>
              <button className="btn">Enviar chamado</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal resolver */}
      {resolvendo !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setResolvendo(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>✅ Resolver chamado #{resolvendo}</h3>
            <div className="input-group">
              <label>Como foi resolvido?</label>
              <textarea className="input" rows={3} value={textoResposta} onChange={(e) => setTextoResposta(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setResolvendo(null)}>Cancelar</button>
              <button className="btn success" onClick={resolver}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
