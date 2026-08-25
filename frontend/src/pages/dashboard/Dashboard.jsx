import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  AlertTriangle, Clock, Trophy, CheckCircle2, LogIn, LogOut, Activity,
} from 'lucide-react';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Card({ icon: Icon, cor = '#38bdf8', label, valor, sub, subCor }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icon size={19} color={cor} />
        {sub !== undefined && <span style={{ fontSize: 12, fontWeight: 700, color: subCor || 'var(--muted)' }}>{sub}</span>}
      </div>
      <div className="metric-value gradient-text" style={{ fontSize: 23, marginTop: 6 }}>{valor}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function BarraProgresso({ percentual, concluida }) {
  return (
    <div style={{ height: 7, borderRadius: 4, background: 'rgba(56,189,248,.1)', overflow: 'hidden' }}>
      <div style={{
        width: `${percentual}%`, height: '100%', transition: 'width .4s',
        background: concluida ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#2563eb,#38bdf8)',
      }} />
    </div>
  );
}

// Gráfico de linha (lucro) + área — SVG puro
function GraficoLinha({ serie }) {
  if (!serie?.length || serie.length < 2) {
    return <p style={{ color: 'var(--muted)', fontSize: 13 }}>Dados insuficientes para o gráfico.</p>;
  }
  const W = 300, H = 80;
  const maxLucro = Math.max(...serie.map((s) => Number(s.lucro)), 1);
  const pts = serie.map((s, i) => ({
    x: (i / (serie.length - 1)) * W,
    y: H - (Number(s.lucro) / maxLucro) * (H - 8) - 4,
    ...s,
  }));
  const linha = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${linha} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 150 }}>
      <defs>
        <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity=".35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gradArea)" />
      <path d={linha} fill="none" stroke="#38bdf8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#38bdf8" />)}
    </svg>
  );
}

// ================= PAINEL USUARIO COMUM =================
function PainelUsuario({ data }) {
  return (
    <>
      <h1 className="page-title">Olá! 👋</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>Seu resumo do dia na Intranet TecnoTal.</p>

      <div className="metrics">
        <Card icon={data.meuPonto?.entrada ? LogOut : LogIn}
          cor={data.meuPonto?.entrada ? '#22c55e' : '#f59e0b'}
          label={data.meuPonto?.saida ? 'Dia completo ✓' : data.meuPonto?.entrada ? `Entrada às ${data.meuPonto.entrada}` : 'Sem ponto hoje'}
          valor={<Link to="/ponto" style={{ textDecoration: 'none' }} className="glow-hover">{data.meuPonto?.saida ? data.meuPonto.saida : data.meuPonto?.entrada || 'Bater ponto →'}</Link>} />
        <Card icon={Clock} label="Minhas solicitações pendentes" valor={data.minhasSolicitacoesPendentes} />
        <Card icon={Trophy} label="Metas ativas minhas/equipe" valor={data.minhasMetas.length} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15 }}>🎯 Minhas metas</h3>
          <Link to="/metas" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Ver todas →</Link>
        </div>
        {data.minhasMetas.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma meta ativa no momento.</p>}
        {data.minhasMetas.map((m) => (
          <div key={m.titulo} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
              <span>{m.titulo}</span>
              <b style={{ color: m.percentual >= 100 ? 'var(--success)' : 'var(--cyan)' }}>{m.percentual}%</b>
            </div>
            <BarraProgresso percentual={m.percentual} />
          </div>
        ))}
      </div>

      <Link to="/solicitacoes" className="btn" style={{ textDecoration: 'none' }}>Nova solicitação</Link>
    </>
  );
}

// ================= PAINEL LIDERANÇA =================
function PainelLideranca({ data }) {
  const f = data.financeiro;
  const sobe = f.variacaoLucroPct !== null;
  const varCor = !sobe ? 'var(--muted)' : f.variacaoLucroPct >= 0 ? 'var(--success)' : 'var(--danger)';
  const presentesPct = data.equipe.pontoHoje.length
    ? Math.round((data.equipe.presentes / data.equipe.pontoHoje.length) * 100)
    : 0;

  return (
    <>
      <h1 className="page-title">Visão Geral da Empresa</h1>

      {/* Linha 1: financeiro */}
      <div className="metrics">
        <Card icon={DollarSign} cor="#38bdf8" label="Lucro do mês"
          valor={brl(f.lucroMes)}
          sub={sobe ? `${f.variacaoLucroPct > 0 ? '+' : ''}${f.variacaoLucroPct}%` : '—'}
          subCor={varCor} />
        <Card icon={ShoppingCart} cor="#a78bfa" label="Receita do mês" valor={brl(f.receitaMes)} sub={`${f.vendasMes} vendas`} />
        <Card
          icon={f.variacaoLucroPct >= 0 ? TrendingUp : TrendingDown}
          cor={f.variacaoLucroPct >= 0 ? 'var(--success)' : 'var(--danger)'}
          label="Queda/Alta vs mês anterior"
          valor={sobe ? `${f.variacaoLucroPct > 0 ? '+' : ''}${f.variacaoLucroPct}%` : '—'} />
        <Card icon={Package} cor="#f59e0b" label="Valor em estoque (custo)" valor={brl(data.estoque.valorTotal)}
          sub={data.estoque.emAlerta > 0 ? `${data.estoque.emAlerta} em alerta` : 'OK'}
          subCor={data.estoque.emAlerta > 0 ? 'var(--danger)' : 'var(--success)'} />
      </div>

      {/* Linha 2: gráfico + ranking */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>📈 Lucro por dia (14 dias)</h3>
          <GraficoLinha serie={data.financeiro.serieVendas} />
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>🏆 Produtos que mais venderam (30d)</h3>
          {data.rankingProdutos.map((p, i) => (
            <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {p.nome}</span>
              <span><b>{p.unidades}</b> un · <span style={{ color: 'var(--success)' }}>{brl(p.lucro)}</span></span>
            </div>
          ))}
          {!data.rankingProdutos.length && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sem vendas ainda.</p>}
        </div>
      </div>

      {/* Linha 3: equipe + estoque alerta */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>👥 Equipe hoje ({data.equipe.presentes}/{data.equipe.pontoHoje.length})</h3>
            <Link to="/ponto" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Ponto →</Link>
          </div>
          <BarraProgresso percentual={presentesPct} />
          <div style={{ marginTop: 12 }}>
            {data.equipe.pontoHoje.map((e) => (
              <div key={e.nome} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                <span>{e.nome} <small style={{ color: 'var(--muted)' }}>{e.cargo}</small></span>
                {e.entrada
                  ? <span style={{ color: e.saida ? 'var(--success)' : 'var(--warn)' }}>{e.entrada}{e.saida ? ` → ${e.saida}` : ' · trabalhando'}</span>
                  : <span style={{ color: 'var(--danger)' }}>sem registro</span>}
              </div>
            ))}
          </div>
          {data.equipe.salariosPendentes > 0 && (
            <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 9, background: 'rgba(245,158,11,.1)', fontSize: 13 }}>
              💰 {data.equipe.salariosPendentes} pagamento(s) pendente(s) — ~{brl(data.equipe.salariosValor)}{' '}
              <Link to="/salarios" style={{ color: 'var(--cyan)' }}>resolver →</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}><AlertTriangle size={15} color="#f59e0b" /> Reposição de estoque</h3>
            <Link to="/produtos" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Produtos →</Link>
          </div>
          {data.estoque.topAlerta.length === 0 && <p style={{ color: 'var(--success)', fontSize: 13 }}>✓ Todo o estoque saudável.</p>}
          {data.estoque.topAlerta.map((p) => (
            <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span>{p.nome}</span>
              <b style={{ color: 'var(--danger)' }}>{p.quantidade} / mín {p.minimo}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Linha 4: metas da empresa + operação */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}>🎯 Metas ativas</h3>
            <Link to="/metas" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Gerenciar →</Link>
          </div>
          {data.metasEmpresa.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma meta ativa.</p>}
          {data.metasEmpresa.map((m) => (
            <div key={m.titulo} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{m.titulo} <small style={{ color: 'var(--muted)' }}>({m.responsavel})</small></span>
                <b style={{ color: 'var(--cyan)' }}>{m.percentual}%</b>
              </div>
              <BarraProgresso percentual={m.percentual} />
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15 }}><Activity size={15} /> Movimento recente</h3>
            <Link to="/relatorios" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Relatórios →</Link>
          </div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 13 }}><CheckCircle2 size={13} color="var(--success)" /> {data.operacao.usuariosAtivos} usuários ativos</span>
            <span style={{ fontSize: 13 }}><Clock size={13} color="var(--warn)" /> {data.operacao.solicitacoesPendentes} solicitações pendentes</span>
          </div>
          {data.ativRecentes.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span><b style={{ color: 'var(--cyan)' }}>{a.usuario || '—'}</b> · {a.acao}{a.detalhes ? ` (${a.detalhes})` : ''}</span>
              <span style={{ color: 'var(--muted)' }}>{new Date(a.criado_em).toLocaleTimeString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metas pessoais do gestor */}
      {data.minhasMetas.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>🎯 Metas que me envolvem</h3>
          {data.minhasMetas.map((m) => (
            <div key={m.titulo} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{m.titulo}</span><b style={{ color: 'var(--cyan)' }}>{m.percentual}%</b>
              </div>
              <BarraProgresso percentual={m.percentual} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/dashboard/resumo').then((r) => setData(r.data)).catch(() => setErro('Erro ao carregar dashboard'));
  }, []);

  if (erro) return <div className="alert-error">{erro}</div>;
  if (!data) return <div className="spinner" />;

  const saudacao = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 6 }}>
        {saudacao}, <b style={{ color: 'var(--text)' }}>{usuario?.nome?.split(' ')[0]}</b> — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      {data.papel === 'LIDERANCA' ? <PainelLideranca data={data} /> : <PainelUsuario data={data} />}
    </>
  );
}
