import { useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pode } from '../utils/permissions';

// usePermission().can('usuarios.criar') — checagem de permissão no front (UX)
export function usePermission() {
  const { usuario } = useAuth();
  const can = (permissao) => (usuario ? pode(usuario.cargo, permissao) : false);
  return { can, cargo: usuario?.cargo };
}
