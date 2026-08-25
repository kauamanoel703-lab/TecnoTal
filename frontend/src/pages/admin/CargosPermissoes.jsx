import { useEffect, useState } from 'react';
import api from '../../services/api';

// Matriz visual cargo × permissão com checkboxes
export default function CargosPermissoes() {
  const [cargos, setCargos] = useState([]);
  const [todasPermissoes, setTodasPermissoes] = useState([]);
  const [marcados, setMarcados] = useState({}); // { cargoId: Set(codigo) }
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/admin/cargos')
      .then(({ data }) => {
        setCargos(data.cargos);
        const permsUnicas = [];
        const seen = new Set();
        data.cargos.forEach((c) =>
          c.permissoes.forEach((p) => {
            if (!seen.has(p.codigo)) { seen.add(p.codigo); permsUnicas.push(p); }
          })
        );
        // completa lista a partir de todas as permissões conhecidas
        if (permsUnicas.length) setTodasPermissoes(permsUnicas.sort((a, b) => a.codigo.localeCompare(b.codigo)));
        const m = {};
        data.cargos.forEach((c) => { m[c.id] = new Set(c.permissoes.map((p) => p.codigo)); });
        setMarcados(m);
      })
      .catch(() => setErro('Erro ao carregar cargos/permissões'));
  }, []);

  function toggle(cargoId, codigo) {
    setMarcados((m) => {
      const copia = { ...m, [cargoId]: new Set(m[cargoId]) };
      copia[cargoId].has(codigo) ? copia[cargoId].delete(codigo) : copia[cargoId].add(codigo);
      return copia;
    });
  }

  async function salvarCargo(cargoId, nome) {
    setMsg(''); setErro('');
    try {
      await api.put(`/admin/cargos/${cargoId}/permissoes`, { permissoes: [...marcados[cargoId]] });
      setMsg(`Permissões de ${nome} salvas`);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    }
  }

  if (erro && !cargos.length) return <div className="alert-error">{erro}</div>;

  return (
    <>
      <h1 className="page-title">Cargos e Permissões</h1>
      {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
      {erro && <div className="alert-error" style={{ marginBottom: 10 }}>{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {cargos.map((cargo) => (
          <div className="card" key={cargo.id}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{cargo.nome}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>{cargo.descricao}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {todasPermissoes.map((p) => (
                <label key={p.codigo} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: cargo.nome === 'ADMIN' ? 'not-allowed' : 'pointer', opacity: cargo.nome === 'ADMIN' ? .6 : 1 }}>
                  <input
                    type="checkbox"
                    checked={marcados[cargo.id]?.has(p.codigo) || false}
                    disabled={cargo.nome === 'ADMIN'} // ADMIN sempre tem tudo
                    onChange={() => toggle(cargo.id, p.codigo)}
                  />
                  <span>{p.codigo}</span>
                </label>
              ))}
            </div>
            <button className="btn" style={{ padding: '9px 18px' }} disabled={cargo.nome === 'ADMIN'} onClick={() => salvarCargo(cargo.id, cargo.nome)}>
              Salvar {cargo.nome}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
