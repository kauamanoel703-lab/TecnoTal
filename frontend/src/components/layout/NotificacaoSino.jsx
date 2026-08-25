import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../../services/api';

// Sino de notificações: badge com não lidas, dropdown com lista
export default function NotificacaoSino() {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState({ notificacoes: [], naoLidas: 0 });
  const ref = useRef(null);

  async function carregar() {
    try {
      const { data } = await api.get('/notifications');
      setDados(data);
    } catch { /* silencioso */ }
  }

  // carrega agora e a cada 30s (polling; WebSocket seria a evolução)
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 30_000);
    return () => clearInterval(t);
  }, []);

  // fecha ao clicar fora
  useEffect(() => {
    function fora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  async function abrir() {
    const proximo = !aberto;
    setAberto(proximo);
    if (proximo && dados.naoLidas > 0) {
      try {
        await api.post('/notifications/ler-todas');
        setDados((d) => ({ ...d, naoLidas: 0 }));
      } catch { /* silencioso */ }
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn ghost" onClick={abrir} style={{ padding: '8px 10px', position: 'relative' }} title="Notificações">
        <Bell size={16} />
        {dados.naoLidas > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: 'var(--danger)', color: '#fff',
            borderRadius: '999px', fontSize: 10, fontWeight: 700,
            minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {dados.naoLidas > 9 ? '9+' : dados.naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', width: 320, zIndex: 60,
          background: 'rgba(15,23,42,.98)', border: '1px solid var(--glass-border)',
          borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
          maxHeight: 380, overflowY: 'auto', padding: 8,
        }}>
          <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Notificações
          </div>
          {dados.notificacoes.length === 0 && (
            <p style={{ padding: '10px 12px', fontSize: 13, color: 'var(--muted)' }}>Nada por aqui.</p>
          )}
          {dados.notificacoes.map((n) => (
            <div key={n.id} style={{
              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
              background: n.lida ? 'transparent' : 'rgba(56,189,248,.08)',
              borderLeft: n.lida ? '2px solid transparent' : '2px solid var(--cyan)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{n.titulo}</div>
              {n.mensagem && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{n.mensagem}</div>}
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {new Date(n.criadoEm).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
