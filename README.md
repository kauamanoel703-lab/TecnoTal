# Intranet TecnoTal

Intranet corporativa da TecnoTal: gestão de usuários, cargos/permissões (RBAC), solicitações com aprovação, relatórios e auditoria.

## Stack

- **Frontend:** React 19 + Vite (CSS Modules, framer-motion, lucide-react)
- **Backend:** Node.js + Express (JWT em cookie HttpOnly)
- **Banco:** MySQL/MariaDB (XAMPP) — banco `intranet_tecnotal`
- **Segurança:** bcryptjs, queries parametrizadas, rate limiting, helmet, CORS restritivo, RBAC em duas camadas

## Estrutura

```
TecnoTal/
├── frontend/   # React + Vite (telas, componentes, UX)
├── backend/    # Node/Express API (auth, regras de negócio, RBAC)
├── database/   # schema.sql, seed.sql, migrations/
└── docs/       # arquitetura, banco-de-dados, permissoes, seguranca
```

## Como rodar (desenvolvimento)

1. Suba o MySQL do XAMPP.
2. Crie o banco: `mysql -u root < database/schema.sql` e depois `seed.sql`.
3. Backend:
   ```bash
   cd backend
   cp .env.example .env   # ajuste se necessário
   npm install
   npm run dev            # porta 3001
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev            # porta 5173
   ```

## Regras de ouro

- O React NUNCA acessa o MySQL diretamente — só via API Node.
- Autorização é decidida SEMPRE no backend; o front só esconde botões.
- `.env` nunca vai para o Git.
- Queries sempre parametrizadas (`?`), nunca concatenação de string.

Veja `docs/seguranca.md` para a política completa.
