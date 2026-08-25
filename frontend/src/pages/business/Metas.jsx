import { useEffect, useState } from 'react';
import { businessService } from '../../services/businessService';
import { Trophy, Target } from 'lucide-react';

export default function Metas() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ titulo: '', tipo: 'QUANTIDADE', objetivo: '', responsavelId: '', dataInicio: '', dataFim: '' });
  const [incremento, setIncremento] = useState({}); // metaId -> qtd a somar

  const carregar = () => businessService.listarMetas().then(setLista).catch(() => setErro('Erro ao carregar metas'));
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro(''); setMsg('');
    try {
      await businessService.criarMeta({ ...form, objetivo: Number(form.objetivo), responsavelId: form.responsavelId || null });
      setMsg(`Meta "${form.titulo}" criada`);
      setForm({ titulo: '', tipo: 'QUANTIDADE', objetivo: '', responsavelId: '', dataInicio: '', dataFim: '' });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar meta');
    }
  }

  async function somarProgresso(id) {
    const qtd = Number(incremento[id] || 0);
    if (!qtd) return;
    try {
      const { data } = await businessService.atualizarProgresso(id, { progresso: qtd, incremento: true });
      if (data.concluida) alert('🏆 Meta batida! Parabéns!');
      setIncremento((s) => ({ ...s, [id]: '' }));
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro');
    }
  }

  const fmt = (m) => (m.tipo === 'VALOR'
    ? Number(m.progresso).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : m.progresso);
  const fmtObj = (m) => (m.tipo === 'VALOR'
    ? Number(m.objetivo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : m.objetivo);

  return (
    <>
      <h1 className="page-title">🎯 Metas</h1>
      {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
      {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}

      <div className="grid-2">
        <div>
          {!lista ? <div className="spinner" /> : lista.map((m) => (
            <div className="card" key={m.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 15 }}>{m.concluida ? '🏆 ' : '🎯 '}{m.titulo}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    Responsável: {m.responsavel} · até {new Date(m.dataFim + 'T12:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {m.atrasada && !m.concluida && (
                  <span className="badge rejeitada">Atrasada</span>
                )}
                {m.concluida && <span className="badge aprovada">Concluída</span>}
              </div>

              {/* barra de progresso */}
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(56,189,248,.1)', margin: '12px 0 6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${m.percentual}%`, height: '100%',
                  background: m.concluida
                    ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                    : 'linear-gradient(90deg,#2563eb,#38bdf8)',
                  transition: 'width .4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{fmt(m)} / {fmtObj(m)}</span>
                <b style={{ color: m.percentual >= 100 ? 'var(--success)' : 'var(--cyan)' }}>{m.percentual}%</b>
              </div>

              {!m.concluida && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    type="number" min="1" className="input" style={{ padding: '7px 10px', flex: 1 }}
                    placeholder={`+ ${m.tipo === 'VALOR' ? 'valor (R$)' : 'unidades'} alcançadas`}
                    value={incremento[m.id] || ''}
                    onChange={(e) => setIncremento((s) => ({ ...s, [m.id]: e.target.value }))}
                  />
                  <button className="btn" style={{ padding: '7px 16px' }} onClick={() => somarProgresso(m.id)}>Somar</button>
                </div>
              )}
            </div>
          ))}
          {lista?.length === 0 && (
            <div className="card"><p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma meta cadastrada.</p></div>
          )}
        </div>

        {/* Nova meta */}
        <div className="card" style={{ alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}><Target size={15} /> Nova meta</h3>
          <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="input-group"><label>Título *</label>
              <input className="input" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Vender 100 telhas em setembro" required /></div>
            <div className="form-grid">
              <div className="input-group"><label>Tipo</label>
                <select className="input" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="QUANTIDADE">Quantidade (unidades)</option>
                  <option value="VALOR">Valor (R$)</option>
                </select></div>
              <div className="input-group"><label>Objetivo *</label>
                <input type="number" min="1" className="input" value={form.objetivo} onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))} required /></div>
            </div>
            <div className="form-grid">
              <div className="input-group"><label>Início *</label>
                <input type="date" className="input" value={form.dataInicio} onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))} required /></div>
              <div className="input-group"><label>Fim *</label>
                <input type="date" className="input" value={form.dataFim} onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))} required /></div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>Sem responsável específico = meta da equipe toda.</p>
            <button className="btn">Criar meta</button>
          </form>
        </div>
      </div>
    </>
  );
}
