import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { maskCpf, maskTelefone } from '../../utils/masks';

const CARGOS = [{ id: 1, nome: 'ADMIN' }, { id: 2, nome: 'GESTOR' }, { id: 3, nome: 'USUARIO' }];

// Modal de edição de usuário (ADMIN)
export default function EditarUsuarioModal({ usuario, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: usuario.nome,
    telefone: usuario.telefone || '',
    cargoId: usuario.cargoId || usuario.cargo_id || 3,
    senha: '',
  });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try {
      const payload = {
        nome: form.nome,
        telefone: form.telefone,
        cargoId: Number(form.cargoId),
      };
      if (form.senha) payload.senha = form.senha; // só troca se preencheu
      await userService.atualizar(usuario.id, payload);
      onSalvo();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setEnviando(false);
    }
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(2,6,23,.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Editar usuário</h3>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>{usuario.email} · CPF {maskCpf(usuario.cpf)}</p>
        {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-group"><label>Nome</label>
            <input className="input" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></div>
          <div className="input-group"><label>Telefone</label>
            <input className="input" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" /></div>
          <div className="input-group"><label>Cargo</label>
            <select className="input" value={form.cargoId} onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))}>
              {CARGOS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select></div>
          <div className="input-group"><label>Nova senha (deixe vazio p/ manter)</label>
            <input type="password" className="input" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} placeholder="8+ c/ letra, número e especial" /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
