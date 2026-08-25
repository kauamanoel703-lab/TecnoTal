import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Configuracoes() {
  const [config, setConfig] = useState({});
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/admin/configuracoes')
      .then(({ data }) => {
        const obj = {};
        data.configuracoes.forEach((c) => { obj[c.chave] = c.valor; });
        setConfig(obj);
      })
      .catch(() => setErro('Erro ao carregar configurações'));
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setMsg(''); setErro('');
    try {
      await api.put('/admin/configuracoes', config);
      setMsg('Configurações salvas');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    }
  }

  return (
    <>
      <h1 className="page-title">Configurações do Sistema</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12 }}>{msg}</div>}
        {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label>Nome do sistema</label>
            <input className="input" value={config.nome_sistema || ''} onChange={(e) => setConfig((c) => ({ ...c, nome_sistema: e.target.value }))} />
          </div>
          <div className="form-grid">
            <div className="input-group">
              <label>Máx. tentativas de login</label>
              <input type="number" min="3" max="50" className="input" value={config.max_tentativas_login || ''} onChange={(e) => setConfig((c) => ({ ...c, max_tentativas_login: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Bloqueio (minutos)</label>
              <input type="number" min="1" max="120" className="input" value={config.bloqueio_login_minutos || ''} onChange={(e) => setConfig((c) => ({ ...c, bloqueio_login_minutos: e.target.value }))} />
            </div>
          </div>
          <button className="btn">Salvar</button>
        </form>
      </div>
    </>
  );
}
