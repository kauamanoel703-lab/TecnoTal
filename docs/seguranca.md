# Política de Segurança — INTRANET TECNOTAL

Regras oficiais do projeto. Todo código novo deve respeitá-las.

1. Nunca armazenar senhas em texto puro (bcryptjs, custo 12).
2. Utilizar queries parametrizadas (`db.execute('... ?', [valor])`) — nunca concatenação.
3. Validar dados no frontend E no backend.
4. Nunca confiar em permissões/cargo vindos do frontend.
5. RBAC obrigatório no backend (`roleMiddleware`).
6. Rate limiting em endpoints sensíveis (login: 5 tentativas → bloqueio temporário).
7. Não armazenar secrets no Git (`.env` fora do versionamento).
8. Utilizar HTTPS em produção.
9. Utilizar cookies seguros para sessão (HttpOnly, SameSite; Secure em produção).
10. Registrar ações administrativas na tabela `atividades`.
11. Não registrar senhas ou tokens nos logs.
12. Aplicar princípio do menor privilégio no MySQL (usuário `intranet_app` em produção).
13. Manter dependências atualizadas.
14. Não expor MySQL/phpMyAdmin publicamente.
15. Fazer backup periódico do banco.

## Respostas de erro

- **401** = não autenticado
- **403** = autenticado, mas sem permissão

Login nunca diferencia "e-mail não existe" de "senha incorreta": sempre
"E-mail ou senha inválidos." (anti-enumeração).

## Prioridades v1 (essenciais)

bcrypt · queries parametrizadas · auth segura · RBAC backend · validação de entrada · rate limiting · CORS restritivo · .env fora do Git · cookies seguros · HTTPS em produção · logs de auditoria · menor privilégio.
