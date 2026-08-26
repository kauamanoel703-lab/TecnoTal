import { useEffect, useRef, useState } from 'react';
import { setoresService } from '../../services/businessService';
import { FileText, Download, Trash2, Plus, ShoppingCart, Clock, LifeBuoy } from 'lucide-react';
import { requestService } from '../../services/userService';
import api from '../../services/api';

const CATEGORIAS = ['Contrato', 'Política', 'Edital', 'Ata', 'Financeiro', 'Outro'];

export default function Administrativo() {
  const [docs, setDocs] = useState(null);
  const [pendentes, setPendentes] = useState(null);
  const [vendas, setVendas] = useState(null);
  const [chamadosADM, setChamadosADM] = useState([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  // form documento
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Contrato');
  const [visibilidade, setVisibilidade] = useState('TODOS');
  const [arquivos, setArquivos] = useState([]);
  const fileRef = useRef(null);

  const carregar = () => {
    setoresService.listarDocs().then(setDocs).catch(() => setErro('Erro ao carregar documentos'));
    requestService.todas().then(setPendentes).catch(() => {});
    api.get('/business/financeiro/ultimas-vendas').then((r) => setVendas(r.data.vendas.slice(0, 5))).catch(() => {});
    api.get('/chamados?departamento=ADMINISTRATIVO').then((r) => setChamadosADM(r.data.chamados.filter((c) => c.status !== 'RESOLVIDO'))).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    if (!arquivos.length) return setErro('Escolha pelo menos um arquivo');
    setErro(''); setMsg('');
    try {
      await setoresService.enviarDocs(arquivos, titulo, categoria, visibilidade);
      setMsg('Documento(s) publicado(s)');
      setTitulo(''); setArquivos([]);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro no upload');
    }
  }

  async function excluir(d) {
    if (!confirm(`Excluir "${d.titulo}"?`)) return;
    try {
      await setoresService.excluirDoc(d.id);
      carregar();
    } catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  return (
    <>
      <h1 className="page-title">🏢 Administrativo</h1>

      {/* resumo rápido */}
      <div className="metrics">
        <div className="card"><FileText size={19} color="#38bdf8" />
          <div className="metric-value gradient-text">{docs?.length ?? '—'}</div>
          <div className="metric-label">Documentos publicados</div></div>
        <div className="card"><ShoppingCart size={19} color="#22c55e" />
          <div className="metric-value gradient-text">{vendas?.length ?? '—'}</div>
          <div className="metric-label">Últimas vendas registradas</div></div>
        <div className="card"><LifeBuoy size={19} color="#f59e0b" />
          <div className="metric-value gradient-text">{chamadosADM.length}</div>
          <div className="metric-label">Chamados do setor abertos</div></div>
        <div className="card"><Clock size={19} color="#a78bfa" />
          <div className="metric-value gradient-text">
            {(pendentes || []).filter((s) => s.status === 'PENDENTE').length}
          </div>
          <div className="metric-label">Solicitações pendentes</div></div>
      </div>

      {/* chamados do setor */}
      {chamadosADM.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>🎫 Chamados do Administrativo</h3>
          {chamadosADM.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span><b>#{c.id}</b> {c.titulo} — {c.abertoPor}</span>
              <b style={{ color: c.prioridade === 'ALTA' ? 'var(--danger)' : 'var(--warn)', fontSize: 12 }}>{c.prioridade}</b>
            </div>
          ))}
        </div>
      )}

      {/* publicar documento */}
      <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}><Plus size={15} /> Publicar documento</h3>
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}
        <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group"><label>Título</label>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato fornecedor X" /></div>
          <div className="form-grid">
            <div className="input-group"><label>Categoria</label>
              <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select></div>
            <div className="input-group"><label>Visível para</label>
              <select className="input" value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}>
                <option value="TODOS">Todos</option>
                <option value="LIDERANCA">Só liderança</option>
                <option value="RH">Só RH</option>
                <option value="TI">Só T.I.</option>
              </select></div>
          </div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
            onChange={(e) => setArquivos(Array.from(e.target.files).slice(0, 5))} style={{ display: 'none' }} />
          <button type="button" className="btn ghost" style={{ padding: '9px 14px' }} onClick={() => fileRef.current?.click()}>
            Escolher arquivos ({arquivos.length})
          </button>
          {arquivos.map((f, i) => (
            <small key={i} style={{ color: 'var(--muted)' }}>📎 {f.name}</small>
          ))}
          <button className="btn">Publicar</button>
        </form>
      </div>

      {/* lista de documentos */}
      <div className="card table-wrap" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>📄 Documentos da empresa</h3>
        {!docs ? <div className="spinner" /> : (
          <table className="table">
            <thead><tr><th>Título</th><th>Categoria</th><th>Visibilidade</th><th>Enviado</th><th>Ações</th></tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.titulo}<br /><small style={{ color: 'var(--muted)' }}>{d.nome_original} · {(d.tamanho / 1024).toFixed(0)} KB · por {d.enviadoPor}</small></td>
                  <td>{d.categoria}</td>
                  <td><span className="badge pendente">{d.visivelPara}</span></td>
                  <td>{d.criadoEm}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn ghost" style={{ padding: '4px 8px' }}
                        onClick={() => setoresService.baixarDoc(d.id, d.nome_original)}><Download size={13} /></button>
                      <button className="btn danger" style={{ padding: '4px 8px' }} onClick={() => excluir(d)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Nenhum documento.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* vendas recentes */}
      {vendas && vendas.length > 0 && (
        <div className="card table-wrap">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>🛒 Vendas recentes</h3>
          <table className="table">
            <thead><tr><th>Produto</th><th>Vendedor</th><th>Qtd</th><th>Total</th></tr></thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id}><td>{v.produto}</td><td>{v.vendedor}</td><td>{v.quantidade}</td><td>{brl(v.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function brl(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
