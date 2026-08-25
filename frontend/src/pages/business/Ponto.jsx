import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { pode } from '../../utils/permissions';
import { businessService } from '../../services/businessService';
import { LogIn, LogOut, Clock, Users } from 'lucide-react';

// Página de Ponto: funcionário bate entrada/saída; gestor vê a equipe
export default function Ponto() {
  const { usuario } = useAuth();
  const ehGestor = pode(usuario?.cargo, 'relatorios.ver');
  const [meus, setMeus] = useState(null);
  const [equipe, setEquipe] = useState(null);
  const [diaEquipe, setDiaEquipe] = useState(new Date().toLocaleDateString('sv-SE'));
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }
  const [agora, setAgora] = useState(new Date());

  const carregar = () => businessService.meuPonto().then(setMeus).catch(() => {});
  useEffect(() => {
    carregar();
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (ehGestor) businessService.pontoEquipe(diaEquipe).then(setEquipe).catch(() => setEquipe([]));
  }, [diaEquipe, ehGestor]);

  async function bater() {
    setMsg(null);
    try {
      const r = await businessService.baterPonto();
      setMsg({ tipo: 'ok', texto: `${r.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada às ${r.hora}` });
      carregar();
      if (ehGestor) businessService.pontoEquipe(diaEquipe).then(setEquipe).catch(() => {});
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.erro || 'Erro ao registrar ponto' });
    }
  }

  const hoje = meus?.[0];
  const podeBaterEntrada = !hoje || !hoje.entrada;
  const podeBaterSaida = hoje && hoje.entrada && !hoje.saida;
  const desabilitado = hoje && hoje.entrada && hoje.saida;

  return (
    <>
      <h1 className="page-title">⏰ Ponto</h1>

      {/* Relógio + botão */}
      <div className="card" style={{ maxWidth: 460, textAlign: 'center', marginBottom: 20 }}>
        <Clock size={28} color="#38bdf8" style={{ margin: '0 auto 8px' }} />
        <div className="metric-value gradient-text" style={{ fontSize: 42 }}>
          {agora.toLocaleTimeString('pt-BR')}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
          {hoje?.entrada ? `Entrada hoje: ${hoje.entrada}` : 'Sem entrada registrada hoje'}
          {hoje?.saida ? ` · Saída: ${hoje.saida}` : ''}
        </p>
        <button
          className={`btn full ${desabilitado ? '' : podeBaterEntrada ? 'success' : ''}`}
          onClick={bater}
          disabled={desabilitado}
        >
          {desabilitado ? '✓ Dia completo' : podeBaterEntrada ? <><LogIn size={16} /> BATER ENTRADA</> : <><LogOut size={16} /> BATER SAÍDA</>}
        </button>
        {msg && (
          <p style={{ marginTop: 12, fontSize: 13, color: msg.tipo === 'ok' ? 'var(--success)' : 'var(--danger)' }}>{msg.texto}</p>
        )}
      </div>

      <div className="grid-2">
        {/* Meus registros */}
        <div className="card table-wrap">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Meus últimos dias</h3>
          {!meus ? <div className="spinner" /> : (
            <table className="table">
              <thead><tr><th>Dia</th><th>Entrada</th><th>Saída</th></tr></thead>
              <tbody>
                {meus.map((r2) => (
                  <tr key={r2.dia}>
                    <td>{new Date(r2.dia + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ color: 'var(--success)' }}>{r2.entrada || '—'}</td>
                    <td style={{ color: 'var(--warn)' }}>{r2.saida || '—'}</td>
                  </tr>
                ))}
                {meus.length === 0 && <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Nenhum registro.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Equipe (gestor/admin) */}
        {ehGestor && (
          <div className="card table-wrap">
            <h3 style={{ fontSize: 15, marginBottom: 12 }}><Users size={15} /> Ponto da equipe</h3>
            <input
              type="date" className="input" style={{ padding: '8px 12px', marginBottom: 12 }}
              value={diaEquipe} onChange={(e) => setDiaEquipe(e.target.value)}
            />
            {!equipe ? <div className="spinner" /> : (
              <table className="table">
                <thead><tr><th>Funcionário</th><th>Entrada</th><th>Saída</th></tr></thead>
                <tbody>
                  {equipe.map((f) => (
                    <tr key={f.nome}>
                      <td>{f.nome}</td>
                      <td>{f.entrada || <span style={{ color: 'var(--danger)' }}>sem registro</span>}</td>
                      <td>{f.saida || '—'}</td>
                    </tr>
                  ))}
                  {equipe.length === 0 && <tr><td colSpan={3} style={{ color: 'var(--muted)' }}>Ninguém na equipe.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
