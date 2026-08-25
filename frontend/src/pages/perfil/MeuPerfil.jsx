import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { maskTelefone } from '../../utils/masks';

export default function MeuPerfil() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [msg, setMsg] = useState(null);
  const [erro, setErro] = useState('');

  async function salvar(e) {
    e.preventDefault();
    setErro(''); setMsg(null);
    try {
      const payload = { nome, telefone };
      if (novaSenha) {
        payload.senhaAtual = senhaAtual;
        payload.novaSenha = novaSenha;
      }
      await userService.editarPerfil(payload);
      setMsg('Perfil atualizado com sucesso');
      setSenhaAtual(''); setNovaSenha('');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    }
  }

  return (
    <>
      <h1 className="page-title">Meu Perfil</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
          {usuario?.email} · Cargo: <b style={{ color: 'var(--cyan)' }}>{usuario?.cargo}</b>
        </p>
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12 }}>{msg}</div>}
        {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}
        <form onSubmit={salvar} className="form-grid">
          <div className="input-group">
            <label>Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Telefone</label>
            <input className="input" value={telefone} onChange={(e) => setTelefone(maskTelefone(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <div className="input-group">
            <label>Senha atual (para trocar senha)</label>
            <input type="password" className="input" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Nova senha</label>
            <input type="password" className="input" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          </div>
          <div>
            <button className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </>
  );
}
