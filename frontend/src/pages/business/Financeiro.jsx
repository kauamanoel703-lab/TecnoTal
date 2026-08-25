import { useEffect, useState } from 'react';
import { financeiroService, businessService } from '../../services/businessService';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Trophy, PackageX, AlertTriangle, Clock, Plus, X,
} from 'lucide-react';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Metric({ icon: Icon, cor, label, valor, sub, subCor }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon size={20} color={cor} />
        {sub !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, color: subCor || 'var(--muted)' }}>{sub}</span>
        )}
      </div>
      <div className="metric-value gradient-text" style={{ fontSize: 24 }}>{valor}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

// Gráfico de barras duplas (receita x lucro) em SVG puro
function GraficoDiario({ serie }) {
  if (!serie?.length) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sem vendas nos últimos 30 dias.</p>;
  const max = Math.max(...serie.map((s) => Number(s.receita)), 1);
  const W = 100; // viewBox percentual
  const larguraBarra = 90 / serie.length;

  return (
    <div>
      <svg viewBox={`0 0 ${W} 42`} preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
        {serie.map((s, i) => {
          const hR = (Number(s.receita) / max) * 38;
          const hL = (Number(s.lucro) / max) * 38;
          const x = 5 + i * larguraBarra;
          return (
            <g key={i}>
              <rect x={x} y={40 - hR} width={larguraBarra * 0.55} height={hR} rx="0.6" fill="#2563eb" opacity=".75" />
              <rect x={x + larguraBarra * 0.58} y={40 - hL} width={larguraBarra * 0.4} height={hL} rx="0.6" fill="#22c55e" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: '#2563eb', borderRadius: 2, marginRight: 5 }} />Receita</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, background: '#22c55e', borderRadius: 2, marginRight: 5 }} />Lucro</span>
        <span style={{ marginLeft: 'auto' }}>
          {new Date(serie[0].dia + 'T12:00').toLocaleDateString('pt-BR')} →{' '}
          {new Date(serie[serie.length - 1].dia + 'T12:00').toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const [resumo, setResumo] = useState(null);
  const [ultimas, setUltimas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');

  // modal nova venda
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaForm, setVendaForm] = useState({ produtoId: '', quantidade: '', precoUnitario: '', observacao: '' });
  const [enviandoVenda, setEnviandoVenda] = useState(false);

  const carregar = () => {
    financeiroService.resumo().then(setResumo).catch(() => setErro('Erro ao carregar métricas'));
    financeiroService.ultimasVendas().then(setUltimas).catch(() => {});
    businessService.listarProdutos().then(setProdutos).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  async function vender(e) {
    e.preventDefault();
    setEnviandoVenda(true);
    try {
      await financeiroService.registrarVenda(
        Number(vendaForm.produtoId),
        Number(vendaForm.quantidade),
        vendaForm.precoUnitario === '' ? null : Number(vendaForm.precoUnitario),
        vendaForm.observacao
      );
      setModalAberto(false);
      setVendaForm({ produtoId: '', quantidade: '', precoUnitario: '', observacao: '' });
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao registrar venda');
    } finally {
      setEnviandoVenda(false);
    }
  }

  if (erro && !resumo) return <div className="alert-error">{erro}</div>;
  if (!resumo) return <div className="spinner" />;

  const { mesAtual, pendencias } = resumo;
  const sobe = mesAtual.variacaoLucroPct !== null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>📈 Financeiro</h1>
        <button className="btn" onClick={() => setModalAberto(true)}>
          <Plus size={15} /> Registrar venda
        </button>
      </div>

      {/* Métricas principais */}
      <div className="metrics">
        <Metric icon={DollarSign} cor="#38bdf8" label="Lucro do mês"
          valor={brl(mesAtual.lucro)}
          sub={sobe ? `${mesAtual.variacaoLucroPct > 0 ? '+' : ''}${mesAtual.variacaoLucroPct}%` : 'sem base'}
          subCor={sobe ? (mesAtual.variacaoLucroPct >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--muted)'} />
        <Metric icon={ShoppingCart} cor="#a78bfa" label="Receita do mês" valor={brl(mesAtual.receita)}
          sub={`${mesAtual.numVendas} vendas`} />
        <Metric
          icon={mesAtual.variacaoLucroPct >= 0 ? TrendingUp : TrendingDown}
          cor={mesAtual.variacaoLucroPct >= 0 ? 'var(--success)' : 'var(--danger)'}
          label="vs. mês anterior"
          valor={`${sobe && mesAtual.variacaoLucroPct > 0 ? '▲' : sobe ? '▼' : '—'} ${brl(mesAtual.mesAnteriorLucro)}`} />
        <Metric icon={Trophy} cor="#f59e0b" label="Lucro total (histórico)"
          valor={brl(resumo.geral.lucroTotal)} sub={`${resumo.geral.vendasTotais} vendas`} />
      </div>

      {/* Gráfico + ranking */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Últimos 30 dias</h3>
          <GraficoDiario serie={resumo.serie} />
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>🏆 Ranking de produtos (60 dias)</h3>
          {resumo.maisVendido && (
            <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)' }}>
              <b style={{ fontSize: 13, color: 'var(--success)' }}>🥇 Mais vendido: {resumo.maisVendido.nome}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {resumo.maisVendido.unidades} unidades · lucro {brl(resumo.maisVendido.lucroTotal)}
              </div>
            </div>
          )}
          {resumo.menosVendido && (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)' }}>
              <b style={{ fontSize: 13, color: 'var(--danger)' }}>📉 Menos vendido: {resumo.menosVendido.nome}</b>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {resumo.menosVendido.unidades} unidades · lucro {brl(resumo.menosVendido.lucroTotal)}
              </div>
            </div>
          )}

          {/* lista completa compacta */}
          <table className="table" style={{ marginTop: 14 }}>
            <thead><tr><th>Produto</th><th>Unid.</th><th>Lucro</th></tr></thead>
            <tbody>
              {(resumo.serie ? [] : []).concat()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pendências do mês */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>⏳ Pendências do mês</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: pendencias.salariosAPagar ? 'rgba(245,158,11,.1)' : 'rgba(34,197,94,.08)' }}>
            <Banknote2 /> <div>
              <b style={{ fontSize: 14 }}>{pendencias.salariosAPagar} salário(s)</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>a pagar — ~{brl(pendencias.salariosValorEstimado)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: pendencias.produtosEmAlerta ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.08)' }}>
            <AlertTriangle size={18} color={pendencias.produtosEmAlerta ? '#ef4444' : '#22c55e'} />
            <div>
              <b style={{ fontSize: 14 }}>{pendencias.produtosEmAlerta} produto(s)</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {pendencias.produtosEmAlerta
                  ? `em falta: ${pendencias.listaProdutosAlerta.map((p) => p.nome).join(', ').slice(0, 60)}…`
                  : 'estoque saudável'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: pendencias.solicitacoesPendentes ? 'rgba(56,189,248,.08)' : 'rgba(34,197,94,.08)' }}>
            <Clock size={18} color="#38bdf8" />
            <div>
              <b style={{ fontSize: 14 }}>{pendencias.solicitacoesPendentes} solicitação(ões)</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>aguardando aprovação</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'rgba(167,139,250,.08)' }}>
            <Trophy size={18} color="#a78bfa" />
            <div>
              <b style={{ fontSize: 14 }}>{pendencias.metasAtivas} meta(s)</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>ativas no momento</div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas vendas */}
      <div className="card table-wrap">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Últimas vendas</h3>
        <table className="table">
          <thead><tr><th>Quando</th><th>Produto</th><th>Vendedor</th><th>Qtd</th><th>Total</th><th>Lucro</th></tr></thead>
          <tbody>
            {ultimas.map((v) => (
              <tr key={v.id}>
                <td>{v.quando}</td>
                <td>{v.produto}</td>
                <td>{v.vendedor}</td>
                <td>{v.quantidade}</td>
                <td>{brl(v.total)}</td>
                <td><b style={{ color: 'var(--success)' }}>{brl(v.lucro)}</b></td>
              </tr>
            ))}
            {ultimas.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Nenhuma venda registrada.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal nova venda */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModalAberto(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16 }}>Registrar venda</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModalAberto(false)} />
            </div>
            <form onSubmit={vender} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group"><label>Produto *</label>
                <select className="input" value={vendaForm.produtoId} onChange={(e) => setVendaForm((f) => ({ ...f, produtoId: e.target.value }))} required>
                  <option value="">Selecione…</option>
                  {produtos.filter((p) => p.ativo && p.quantidade > 0).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} — estoque {p.quantidade}</option>
                  ))}
                </select></div>
              <div className="form-grid">
                <div className="input-group"><label>Quantidade *</label>
                  <input type="number" min="1" className="input" value={vendaForm.quantidade} onChange={(e) => setVendaForm((f) => ({ ...f, quantidade: e.target.value }))} required /></div>
                <div className="input-group"><label>Preço unit. (vazio = tabela)</label>
                  <input type="number" step="0.01" min="0" className="input" value={vendaForm.precoUnitario} onChange={(e) => setVendaForm((f) => ({ ...f, precoUnitario: e.target.value }))} placeholder="desconto permitido" /></div>
              </div>
              <div className="input-group"><label>Observação</label>
                <input className="input" value={vendaForm.observacao} onChange={(e) => setVendaForm((f) => ({ ...f, observacao: e.target.value }))} placeholder="Ex: obra centro" /></div>
              <button className="btn" disabled={enviandoVenda}>{enviandoVenda ? 'Registrando…' : 'Registrar venda'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Banknote2() {
  return <span style={{ fontSize: 18 }}>💰</span>;
}
