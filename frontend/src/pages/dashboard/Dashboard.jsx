import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';
import { requestService, reportService } from '../../services/userService';
import { Users, ClipboardList, CheckSquare, Activity, Clock } from 'lucide-react';

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="card">
      <Icon size={20} color="#38bdf8" />
      <div className="metric-value gradient-text">{value ?? '—'}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

// Painel do USUARIO comum: só o que interessa a ele
function PainelUsuario() {
  const { usuario } = useAuth();
  const [minhas, setMinhas] = useState(null);

  useEffect(() => {
    requestService.minhas().then(setMinhas).catch(() => setMinhas([]));
  }, []);

  const pendentes = (minhas || []).filter((s) => s.status === 'PENDENTE').length;
  const aprovadas = (minhas || []).filter((s) => s.status === 'APROVADA').length;

  return (
    <>
      <h1 className="page-title">Olá, {usuario?.nome?.split(' ')[0]}! 👋</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>
        Bem-vindo à Intranet TecnoTal. Aqui você acompanha suas solicitações.
      </p>

      <div className="metrics">
        <Metric icon={ClipboardList} label="Minhas solicitações" value={minhas?.length ?? '—'} />
        <Metric icon={Clock} label="Aguardando aprovação" value={pendentes} />
        <Metric icon={CheckSquare} label="Aprovadas" value={aprovadas} />
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15 }}>Últimas solicitações</h3>
          <Link to="/solicitacoes" style={{ color: 'var(--cyan)', fontSize: 13, textDecoration: 'none' }}>Ver todas →</Link>
        </div>
        {!minhas ? <div className="spinner" /> : (
          minhas.slice(0, 5).map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span>{s.titulo}</span>
              <span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span>
            </div>
          ))
        )}
        {minhas?.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Você ainda não abriu nenhuma solicitação.{' '}
            <Link to="/solicitacoes" style={{ color: 'var(--cyan)' }}>Criar a primeira →</Link>
          </p>
        )}
      </div>
    </>
  );
}

// Painel administrativo (GESTOR/ADMIN): métricas globais
function PainelAdmin() {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    reportService.dashboard()
      .then(setData)
      .catch(() => setErro('Não foi possível carregar o dashboard'));
  }, []);

  if (erro) return <div className="alert-error">{erro}</div>;
  if (!data) return <div className="spinner" />;

  const m = data.metricas;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <div className="metrics">
        <Metric icon={Users} label="Usuários ativos" value={m.usuarios} />
        <Metric icon={ClipboardList} label="Solicitações pendentes" value={m.pendentes} />
        <Metric icon={CheckSquare} label="Aprovadas" value={m.aprovadas} />
        <Metric icon={Activity} label="Atividades hoje" value={m.atividadesHoje} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Atividade (7 dias)</h3>
          {data.serie.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sem dados ainda.</p>}
          {data.serie.map((d) => (
            <div key={d.dia} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', width: 90 }}>{new Date(d.dia).toLocaleDateString('pt-BR')}</span>
              <div style={{ height: 8, borderRadius: 4, flex: 1, background: 'rgba(56,189,248,.1)' }}>
                <div style={{
                  width: `${Math.min(100, d.total * 5)}%`, height: '100%', borderRadius: 4,
                  background: 'linear-gradient(90deg,#2563eb,#38bdf8)',
                }} />
              </div>
              <span style={{ fontSize: 12 }}>{d.total}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Atividades recentes</h3>
          {data.recentes.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid rgba(148,163,184,.08)' }}>
              <span><b style={{ color: 'var(--cyan)' }}>{a.usuario || '—'}</b> · {a.acao}{a.detalhes ? ` (${a.detalhes})` : ''}</span>
              <span style={{ color: 'var(--muted)' }}>{new Date(a.criado_em).toLocaleTimeString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const isAdmin = pode(usuario?.cargo, 'relatorios.ver');
  return isAdmin ? <PainelAdmin /> : <PainelUsuario />;
}
