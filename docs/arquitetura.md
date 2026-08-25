# Arquitetura — Intranet TecnoTal

## Visão geral

```
USUÁRIO → REACT+VITE (5173) --HTTP/JSON--> NODE API (3001) --SQL parametrizado--> MySQL (XAMPP)
```

O React **nunca** acessa o MySQL diretamente. Autorização é sempre decidida no backend.

## Fluxo de requisição protegida

```
REQUISIÇÃO
  → autenticado? (JWT cookie HttpOnly)   não → 401
  → tem permissão? (roleMiddleware)      não → 403
  → controller → service → MySQL
```

## Frontend (React + Vite)

- `components/ui/` — Button, Input, Card, Title, Badge, Modal, Table, Spinner (globais, com efeito glow)
- `components/layout/` — Header, Sidebar, Footer, MobileMenu
- `components/auth|dashboard|users|solicitacoes/`
- `pages/` — auth/, dashboard/, perfil/, solicitacoes/, usuarios/, relatorios/, admin/
- `layouts/` — AuthLayout, IntranetLayout
- `routes/` — AppRoutes, PrivateRoute (autenticado), RoleRoute (cargo)
- `services/` — api.js (axios c/ credentials), authService, userService, requestService
- `contexts/AuthContext.jsx` — estado de sessão
- `hooks/` — useAuth, usePermission, useMobile
- `utils/` — masks.js, permissions.js (RBAC UI), formatters.js

## Backend (Node + Express)

```
backend/src/
├── server.js        # bootstrap (sobe o servidor)
├── app.js           # montagem do Express (middlewares + rotas)
├── controllers/     # authController, userController, requestController, reportController
├── routes/          # authRoutes, userRoutes, requestRoutes, reportRoutes
├── services/        # regras de negócio (authService, userService, requestService)
├── middlewares/     # authMiddleware (JWT), roleMiddleware (RBAC), errorMiddleware
└── database/connection.js  # pool mysql2
```

## Banco (MySQL)

Tabelas: usuarios, cargos, permissoes, cargo_permissoes, solicitacoes, status_solicitacoes,
atividades (auditoria), configuracoes, notificacoes.

Relacionamentos: usuario pertence a cargo; cargo tem N permissões (N:N via cargo_permissoes);
solicitação pertence a usuário e é aprovada por gestor/admin; atividade registra quem/o quê/quando/IP.

## Segurança em camadas

Frontend (validação UX) · Backend (Auth, RBAC, Rate Limit, Validation, Helmet, Audit Log) ·
Banco (SQL parametrizado, menor privilégio).

Detalhes em `docs/seguranca.md`.
