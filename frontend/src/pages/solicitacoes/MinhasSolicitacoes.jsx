import { useEffect, useRef, useState } from 'react';
import { requestService } from '../../services/userService';
import { Paperclip, Download, X } from 'lucide-react';

export default function MinhasSolicitacoes() {
  const [lista, setLista] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [anexosNovos, setAnexosNovos] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // visualização de anexos de uma solicitação
  const [verAnexosDe, setVerAnexosDe] = useState(null);
  const [anexos, setAnexos] = useState([]);

  const fileRef = useRef(null);
  const carregar = () => requestService.minhas().then(setLista).catch(() => setErro('Erro ao carregar'));
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try {
      const { data } = await requestService.criar({ titulo, descricao });
      if (anexosNovos.length) {
        await requestService.enviarAnexos(data.id, anexosNovos);
      }
      setTitulo(''); setDescricao(''); setAnexosNovos([]);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar solicitação');
    } finally {
      setEnviando(false);
    }
  }

  async function abrirAnexos(sol) {
    setVerAnexosDe(sol.id);
    try {
      setAnexos(await requestService.listarAnexos(sol.id));
    } catch {
      setAnexos([]);
    }
  }

  function removerArquivo(i) {
    setAnexosNovos((a) => a.filter((_, idx) => idx !== i));
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
            <div className="input-group">
              <label>Anexos (PDF, DOCX, XLSX, JPG, PNG — até 5MB cada, máx. 3)</label>
              <input
                ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => setAnexosNovos(Array.from(e.target.files).slice(0, 3))}
                style={{ display: 'none' }}
              />
              <button type="button" className="btn ghost" style={{ padding: '9px 14px' }} onClick={() => fileRef.current?.click()}>
                <Paperclip size={14} /> Escolher arquivos
              </button>
              {anexosNovos.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)', background: 'rgba(56,189,248,.06)', padding: '6px 10px', borderRadius: 8 }}>
                  <span>📎 {f.name} ({(f.size / 1024).toFixed(0)} KB)</span>
                  <X size={13} style={{ cursor: 'pointer' }} onClick={() => removerArquivo(i)} />
                </div>
              ))}
            </div>
            <button className="btn" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar'}</button>
          </form>
        </div>

        <div className="card table-wrap">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Histórico</h3>
          {!lista ? <div className="spinner" /> : (
            <table className="table">
              <thead><tr><th>Título</th><th>Status</th><th>Data</th><th></th></tr></thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.id}>
                    <td>{s.titulo}</td>
                    <td><span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                    <td>{new Date(s.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <button
                        className="btn ghost" title="Ver anexos"
                        style={{ padding: '4px 8px' }}
                        onClick={() => abrirAnexos(s)}
                      >
                        <Paperclip size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Nenhuma solicitação.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de anexos */}
      {verAnexosDe !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setVerAnexosDe(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>📎 Anexos da solicitação #{verAnexosDe}</h3>
            {anexos.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum anexo.</p>}
            {anexos.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid rgba(148,163,184,.08)', fontSize: 13 }}>
                <span>📄 {a.nome_original}<br /><small style={{ color: 'var(--muted)' }}>{(a.tamanho / 1024).toFixed(0)} KB · por {a.enviadoPor}</small></span>
                <button className="btn ghost" style={{ padding: '6px 10px' }} onClick={() => requestService.baixarAnexo(a.id, a.nome_original)}>
                  <Download size={14} />
                </button>
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 14 }}>
              <button className="btn ghost" onClick={() => setVerAnexosDe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
