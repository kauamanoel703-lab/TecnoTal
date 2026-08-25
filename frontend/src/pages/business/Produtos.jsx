import { useEffect, useMemo, useState } from 'react';
import { businessService } from '../../services/businessService';
import { AlertTriangle, Package, ArrowDownToLine, ArrowUpFromLine, Pencil } from 'lucide-react';

export default function Produtos() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [busca, setBusca] = useState('');
  const [somenteAlerta, setSomenteAlerta] = useState(false);

  // form novo produto
  const [form, setForm] = useState({ nome: '', sku: '', categoria: '', precoCusto: '', precoVenda: '', quantidade: '', estoqueMinimo: 5 });

  // modal movimentação
  const [mov, setMov] = useState(null); // { produto, tipo }
  const [qtdMov, setQtdMov] = useState('');
  const [obsMov, setObsMov] = useState('');

  const carregar = () => businessService.listarProdutos().then(setLista).catch(() => setErro('Erro ao carregar produtos'));
  useEffect(() => { carregar(); }, []);

  const filtrada = useMemo(() => {
    if (!lista) return [];
    const q = busca.toLowerCase();
    return lista.filter((p) =>
      (!q || p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (!somenteAlerta || p.alertaEstoque)
    );
  }, [lista, busca, somenteAlerta]);

  async function criarProduto(e) {
    e.preventDefault();
    setErro(''); setMsg('');
    try {
      await businessService.criarProduto(form);
      setMsg(`Produto "${form.nome}" cadastrado`);
      setForm({ nome: '', sku: '', categoria: '', precoCusto: '', precoVenda: '', quantidade: '', estoqueMinimo: 5 });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar');
    }
  }

  async function confirmarMov() {
    try {
      await businessService.movimentarEstoque(mov.produto.id, mov.tipo, Number(qtdMov), obsMov);
      setMov(null); setQtdMov(''); setObsMov('');
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro na movimentação');
    }
  }

  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <h1 className="page-title">📦 Produtos &amp; Estoque</h1>
      <div className="card table-wrap" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input className="input" style={{ flex: 2, minWidth: 160, padding: '9px 12px' }}
            placeholder="🔍 Buscar por nome ou SKU…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={somenteAlerta} onChange={(e) => setSomenteAlerta(e.target.checked)} />
            <AlertTriangle size={14} color="#f59e0b" /> Só reposição
          </label>
        </div>
        {!lista ? <div className="spinner" /> : (
          <table className="table">
            <thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Movimentar</th></tr></thead>
            <tbody>
              {filtrada.map((p) => (
                <tr key={p.id}>
                  <td>{p.nome}<br /><small style={{ color: 'var(--muted)' }}>{p.sku}</small></td>
                  <td>{p.categoria || '—'}</td>
                  <td>{brl(p.preco_custo)}</td>
                  <td>{brl(p.preco_venda)}</td>
                  <td>
                    <b style={{ color: p.alertaEstoque ? 'var(--danger)' : 'inherit' }}>{p.quantidade}</b>
                    {p.alertaEstoque && (
                      <span style={{ display: 'inline-flex', marginLeft: 6 }} title={`Abaixo do mínimo (${p.estoque_minimo})`}>
                        <AlertTriangle size={14} color="#f59e0b" />
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn success" style={{ padding: '5px 10px' }} onClick={() => setMov({ produto: p, tipo: 'ENTRADA' })}><ArrowDownToLine size={13} /></button>
                      <button className="btn danger" style={{ padding: '5px 10px' }} onClick={() => setMov({ produto: p, tipo: 'SAIDA' })}><ArrowUpFromLine size={13} /></button>
                      <button className="btn ghost" style={{ padding: '5px 10px' }} title="Ajuste exato" onClick={() => setMov({ produto: p, tipo: 'AJUSTE' })}><Pencil size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrada.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Nenhum produto.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Novo produto</h3>
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}
        <form onSubmit={criarProduto}>
          <div className="form-grid">
            <div className="input-group"><label>Nome *</label><input className="input" value={form.nome} onChange={setF('nome')} required /></div>
            <div className="input-group"><label>SKU *</label><input className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} placeholder="TLH-BAR-050" required /></div>
            <div className="input-group"><label>Categoria</label><input className="input" value={form.categoria} onChange={setF('categoria')} /></div>
            <div className="input-group"><label>Estoque mínimo</label><input type="number" min="0" className="input" value={form.estoqueMinimo} onChange={setF('estoqueMinimo')} /></div>
            <div className="input-group"><label>Preço de custo</label><input type="number" step="0.01" min="0" className="input" value={form.precoCusto} onChange={setF('precoCusto')} /></div>
            <div className="input-group"><label>Preço de venda</label><input type="number" step="0.01" min="0" className="input" value={form.precoVenda} onChange={setF('precoVenda')} /></div>
          </div>
          <div className="input-group" style={{ marginTop: 12 }}><label>Quantidade inicial</label><input type="number" min="0" className="input" value={form.quantidade} onChange={setF('quantidade')} /></div>
          <button className="btn" style={{ marginTop: 14 }}>Cadastrar produto</button>
        </form>
      </div>

      {/* Modal de movimentação */}
      {mov && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setMov(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16 }}>
              {mov.tipo === 'ENTRADA' ? '📥 Entrada' : mov.tipo === 'SAIDA' ? '📤 Saída' : '⚖️ Ajuste'} — {mov.produto.nome}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 16px' }}>Estoque atual: <b>{mov.produto.quantidade}</b></p>
            <div className="input-group">
              <label>{mov.tipo === 'AJUSTE' ? 'Quantidade exata' : 'Quantidade'}</label>
              <input type="number" min="1" className="input" value={qtdMov} onChange={(e) => setQtdMov(e.target.value)} autoFocus />
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Observação</label>
              <input className="input" value={obsMov} onChange={(e) => setObsMov(e.target.value)} placeholder="Ex: nota fiscal 1234" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setMov(null)}>Cancelar</button>
              <button
                className={`btn ${mov.tipo === 'SAIDA' ? 'danger' : mov.tipo === 'AJUSTE' ? 'ghost' : 'success'}`}
                onClick={confirmarMov}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
