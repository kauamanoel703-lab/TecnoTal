import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';
import { salarioService } from '../../services/businessService';
import { Banknote, CheckCircle2, Clock, Wallet } from 'lucide-react';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ===== Visão do FUNCIONÁRIO: meu salário + meus pagamentos =====
function MeuSalario() {
  const [data, setData] = useState(null);
  useEffect(() => { salarioService.meu().then(setData).catch(() => setData({ pagamentos: [], salario: null })); }, []);

  if (!data) return <div className="spinner" />;

  return (
    <>
      <h1 className="page-title">💰 Meu Salário</h1>
      <div className="metrics">
        <div className="card">
          <Wallet size={20} color="#38bdf8" />
          <div className="metric-value gradient-text">{data.salario ? brl(data.salario.valorMensal) : '—'}</div>
          <div className="metric-label">Salário mensal</div>
        </div>
        <div className="card">
          <Clock size={20} color="#38bdf8" />
          <div className="metric-value gradient-text">{data.salario ? `dia ${data.salario.diaPagamento}` : '—'}</div>
          <div className="metric-label">Dia de pagamento</div>
        </div>
      </div>

      <div className="card table-wrap">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Meus pagamentos</h3>
        <table className="table">
          <thead><tr><th>Referência</th><th>Valor</th><th>Pago em</th><th>Observação</th></tr></thead>
          <tbody>
            {data.pagamentos.map((p) => (
              <tr key={p.referenciaMes}>
                <td>{p.referenciaMes}</td>
                <td><b style={{ color: 'var(--success)' }}>{brl(p.valorPago)}</b></td>
                <td>{p.dataPagamento}</td>
                <td style={{ color: 'var(--muted)' }}>{p.observacao || '—'}</td>
              </tr>
            ))}
            {data.pagamentos.length === 0 && (
              <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Nenhum pagamento registrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ===== Visão do GESTOR/ADMIN: folha da equipe =====
function FolhaDaEquipe() {
  const [folha, setFolha] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  // edição inline
  const [editando, setEditando] = useState(null); // usuarioId
  const [valorEdit, setValorEdit] = useState('');
  const [diaEdit, setDiaEdit] = useState(5);

  const carregar = () => {
    salarioService.listar().then(setFolha).catch(() => setErro('Erro ao carregar folha'));
    salarioService.historico().then(setHistorico).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  async function salvarSalario(usuarioId) {
    setErro(''); setMsg('');
    try {
      await salarioService.definir(usuarioId, Number(valorEdit), Number(diaEdit));
      setMsg('Salário atualizado');
      setEditando(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    }
  }

  async function pagar(f) {
    if (!confirm(`Registrar pagamento de ${f.nome} — ref. ${folha.mes}?`)) return;
    setErro(''); setMsg('');
    try {
      await salarioService.pagar(f.usuarioId);
      setMsg(`Pagamento de ${f.nome} registrado`);
      carregar();
      salarioService.historico().then(setHistorico).catch(() => {});
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar pagamento');
    }
  }

  const totalFolha = (folha?.funcionarios || []).reduce((s, f) => s + Number(f.valorMensal || 0), 0);

  return (
    <>
      <h1 className="page-title">💰 Salários — Folha {folha?.mes || ''}</h1>

      {/* resumo */}
      <div className="metrics" style={{ marginBottom: 16 }}>
        <div className="card">
          <Banknote size={20} color="#38bdf8" />
          <div className="metric-value gradient-text">{brl(totalFolha)}</div>
          <div className="metric-label">Total da folha mensal</div>
        </div>
        <div className="card">
          <CheckCircle2 size={20} color="#22c55e" />
          <div className="metric-value gradient-text">
            {(folha?.funcionarios || []).filter((f) => f.pagoEsteMes).length}
          </div>
          <div className="metric-label">Pagos neste mês</div>
        </div>
        <div className="card">
          <Clock size={20} color="#f59e0b" />
          <div className="metric-value gradient-text">
            {(folha?.funcionarios || []).filter((f) => !f.pagoEsteMes).length}
          </div>
          <div className="metric-label">Pendentes neste mês</div>
        </div>
      </div>

      {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
      {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}

      <div className="card table-wrap" style={{ marginBottom: 20 }}>
        {!folha ? <div className="spinner" /> : (
          <table className="table">
            <thead><tr><th>Funcionário</th><th>Cargo</th><th>Salário</th><th>Dia</th><th>Status do mês</th><th>Ações</th></tr></thead>
            <tbody>
              {folha.funcionarios.map((f) => (
                <tr key={f.usuarioId}>
                  <td>{f.nome}<br /><small style={{ color: 'var(--muted)' }}>{f.email}</small></td>
                  <td>{f.cargo}</td>
                  <td>
                    {editando === f.usuarioId ? (
                      <input type="number" step="0.01" min="0" className="input" style={{ padding: '6px 10px', width: 110 }}
                        value={valorEdit} onChange={(e) => setValorEdit(e.target.value)} autoFocus />
                    ) : (
                      <b>{f.valorMensal ? brl(f.valorMensal) : <span style={{ color: 'var(--danger)' }}>não definido</span>}</b>
                    )}
                  </td>
                  <td>
                    {editando === f.usuarioId ? (
                      <input type="number" min="1" max="28" className="input" style={{ padding: '6px 10px', width: 64 }}
                        value={diaEdit} onChange={(e) => setDiaEdit(e.target.value)} />
                    ) : f.diaPagamento}
                  </td>
                  <td>
                    {f.pagoEsteMes
                      ? <span className="badge aprovada">Pago ✓</span>
                      : <span className="badge pendente">Pendente</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {editando === f.usuarioId ? (
                        <>
                          <button className="btn success" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => salvarSalario(f.usuarioId)}>OK</button>
                          <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditando(null)}>✕</button>
                        </>
                      ) : (
                        <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => { setEditando(f.usuarioId); setValorEdit(f.valorMensal || ''); setDiaEdit(f.diaPagamento || 5); }}>
                          Definir
                        </button>
                      )}
                      <button
                        className={`btn ${f.pagoEsteMes ? 'ghost' : ''}`} disabled={f.pagoEsteMes}
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => pagar(f)}>
                        {f.pagoEsteMes ? 'Pago' : 'Pagar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Histórico */}
      {historico && (
        <div className="card table-wrap">
          <h3 style={{ fontSize: 15, marginBottom: 4 }}>Histórico de pagamentos</h3>
          {Object.entries(historico.totaisPorMes).map(([mes, total]) => (
            <span key={mes} style={{ fontSize: 12, color: 'var(--muted)', marginRight: 14 }}>
              {mes}: <b style={{ color: 'var(--cyan)' }}>{brl(total)}</b>
            </span>
          ))}
          <table className="table" style={{ marginTop: 12 }}>
            <thead><tr><th>Funcionário</th><th>Referência</th><th>Valor</th><th>Pago em</th><th>Registrado por</th></tr></thead>
            <tbody>
              {historico.pagamentos.map((p) => (
                <tr key={p.id}>
                  <td>{p.funcionario}</td>
                  <td>{p.referenciaMes}</td>
                  <td><b>{brl(p.valorPago)}</b></td>
                  <td>{p.dataPagamento}</td>
                  <td style={{ color: 'var(--muted)' }}>{p.registradoPor}</td>
                </tr>
              ))}
              {historico.pagamentos.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Nenhum pagamento no histórico.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function Salarios() {
  const { usuario } = useAuth();
  const ehGestor = pode(usuario?.cargo, 'relatorios.ver');
  return ehGestor ? <FolhaDaEquipe /> : <MeuSalario />;
}
