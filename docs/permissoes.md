# Permissões — RBAC

Três cargos fixos no seed: **ADMIN**, **GESTOR**, **USUARIO**.

## Princípio

- O frontend só **esconde/mostra** (UX) via `frontend/src/utils/permissions.js` + `usePermission()`.
- O backend **decide de verdade** via `backend/src/middlewares/roleMiddleware.js`.
- Nunca confiar em cargo/permissão enviado pelo cliente — o servidor lê do token → banco.

## Matriz v1

| Permissão | ADMIN | GESTOR | USUARIO |
|---|---|---|---|
| dashboard.ver | ✅ | ✅ | ✅ |
| perfil.editar_proprio | ✅ | ✅ | ✅ |
| usuarios.listar | ✅ | ✅ | ❌ |
| usuarios.criar / editar / desativar | ✅ | ❌ | ❌ |
| solicitacoes.criar_proprias | ✅ | ✅ | ✅ |
| solicitacoes.aprovar | ✅ | ✅ | ❌ |
| relatorios.ver | ✅ | ✅ | ❌ |
| admin.configuracoes | ✅ | ❌ | ❌ |
| admin.cargos_permissoes | ✅ | ❌ | ❌ |

## Uso

Backend:
```js
router.post('/usuarios', authRequired, requirePermission('usuarios.criar'), userController.criar);
```

Frontend:
```jsx
const { can } = usePermission();
{can('usuarios.criar') && <Button>Novo usuário</Button>}
```

Códigos: 401 não autenticado · 403 sem permissão.
