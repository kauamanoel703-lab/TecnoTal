# Banco de Dados — intranet_tecnotal

MySQL/MariaDB via XAMPP. Credenciais em `backend/.env` (fora do Git).

## Criar do zero

```bash
/c/xampp/mysql/bin/mysql.exe -u root < database/schema.sql
/c/xampp/mysql/bin/mysql.exe -u root intranet_tecnotal < database/seed.sql
```

## Tabelas

| Tabela | Função |
|---|---|
| cargos | ADMIN, GESTOR, USUARIO |
| permissoes | permissões atômicas (usuarios.criar, solicitacoes.aprovar...) |
| cargo_permissoes | N:N cargo ↔ permissão |
| usuarios | dados + senha hash bcrypt + cargo_id |
| status_solicitacoes | PENDENTE, APROVADA, REJEITADA |
| solicitacoes | pedidos do usuário + aprovador |
| atividades | auditoria (quem, ação, quando, IP) |
| configuracoes | chave/valor do sistema |
| notificacoes | avisos por usuário |

## Convenções

- Senha: hash bcryptjs custo 12 (`$2b$12$...`) — nunca texto puro.
- Todas as queries no backend parametrizadas.
- Em produção: usuário dedicado `intranet_app` com permissões só neste banco (menor privilégio). root apenas no dev local.

## Migrações

Alterações futuras vão em `database/migrations/NNN_descricao.sql`, numeradas em ordem, nunca editar migration já aplicada.
