estamos desenvolvendo um projeto, um Intranet TecnoTal. onde eu irei desenvolver a administração da minha empresa. intranet_tecnotal/
│
├── intranet TecnoTal/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Title.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── MobileMenu.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ForgotPasswordForm.jsx
│   │   │   │   └── ResetPasswordForm.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   ├── ActivityChart.jsx
│   │   │   │   └── RecentActivities.jsx
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── UserTable.jsx
│   │   │   │   ├── UserForm.jsx
│   │   │   │   └── UserFilters.jsx
│   │   │   │
│   │   │   └── solicitacoes/
│   │   │       ├── RequestCard.jsx
│   │   │       ├── RequestTable.jsx
│   │   │       └── ApprovalModal.jsx
│   │   │
│   │   ├── pages/
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Cadastro.jsx
│   │   │   │   ├── RecuperarSenha.jsx
│   │   │   │   └── RedefinirSenha.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   │
│   │   │   ├── perfil/
│   │   │   │   └── MeuPerfil.jsx
│   │   │   │
│   │   │   ├── solicitacoes/
│   │   │   │   ├── MinhasSolicitacoes.jsx
│   │   │   │   └── AprovacaoSolicitacoes.jsx
│   │   │   │
│   │   │   ├── usuarios/
│   │   │   │   └── Usuarios.jsx
│   │   │   │
│   │   │   ├── relatorios/
│   │   │   │   └── Relatorios.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── Configuracoes.jsx
│   │   │       └── CargosPermissoes.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   └── IntranetLayout.jsx
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── RoleRoute.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── requestService.js
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── usePermission.js
│   │   │   └── useMobile.js
│   │   │
│   │   ├── utils/
│   │   │   ├── masks.js
│   │   │   ├── permissions.js
│   │   │   └── formatters.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   │
│   ├── src/
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── requestController.js
│   │   │   └── reportController.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── requestRoutes.js
│   │   │   └── reportRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── requestService.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   │
│   │   ├── database/
│   │   │   └── connection.js
│   │   │
│   │   └── server.js
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── docs/
│   ├── arquitetura.md
│   ├── banco-de-dados.md
│   └── permissoes.md
│
├── .gitignore
├── README.md
└── package.json

2. Por que vamos manter essa estrutura?
Porque ela separa claramente as responsabilidades.

Frontend
React + Vite


Cuida de:


telas;

formulários;

animações;

menus;

dashboard;

tabelas;

experiência do usuário.
Backend
Node.js


Cuida de:


autenticação;

regras de negócio;

permissões;

comunicação com banco;

APIs;

segurança.
Banco
MySQL


Cuida de:


usuários;

cargos;

permissões;

solicitações;

atividades;

relatórios;

configurações.
3. A arquitetura completa
A comunicação será:

                    ┌─────────────────────┐
                    │       USUÁRIO       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   REACT + VITE      │
                    │                     │
                    │     FRONTEND        │
                    └──────────┬──────────┘
                               │
                         HTTP / JSON
                               │
                               ▼
                    ┌─────────────────────┐
                    │       NODE.JS       │
                    │                     │
                    │       API           │
                    └──────────┬──────────┘
                               │
                             SQL
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MYSQL         │
                    │       XAMPP         │
                    └─────────────────────┘

O MySQL nunca será acessado diretamente pelo React.
Isso é uma regra importante da nossa arquitetura.
4. Como ficará a autenticação
Vamos aproveitar exatamente o login que você gostou.
A estrutura será:

/auth/login


Visualmente teremos:

┌───────────────────────────────────────┐
│                                       │
│              JUCEPE                   │
│                                       │
│        Acesso à Intranet              │
│                                       │
│   ┌───────────────────────────────┐   │
│   │ E-mail                        │   │
│   └───────────────────────────────┘   │
│                                       │
│   ┌───────────────────────────────┐   │
│   │ Senha                         │   │
│   └───────────────────────────────┘   │
│                                       │
│             Esqueci a senha           │
│                                       │
│   ┌───────────────────────────────┐   │
│   │            ENTRAR              │   │
│   └───────────────────────────────┘   │
│                                       │
└───────────────────────────────────────┘

E continuaremos usando:


glow seguindo mouse;

iluminação dos inputs;

animação dos botões;

transições;

hover;

efeitos sutis.
5. Depois do login
Ao autenticar:

Login
  │
  ▼
Node.js
  │
  ▼
MySQL
  │
  ▼
Usuário encontrado
  │
  ▼
Cargo
  │
  ├──────────────┐
  │              │
  ▼              ▼
ADMIN          GESTOR
  │              │
  └──────┬───────┘
         │
         ▼
     Dashboard

Ou:

USUARIO
   │
   ▼
Painel Principal

6. RBAC
Vamos manter o sistema com três níveis:

ADMIN
GESTOR
USUARIO

ADMIN
Terá:

Dashboard
Meu Perfil
Usuários
Solicitações
Relatórios

Administração
├── Configurações
└── Cargos e Permissões

GESTOR
Terá:

Dashboard
Meu Perfil
Usuários
Solicitações
Relatórios

USUÁRIO
Terá:

Painel Principal
Meu Perfil
Minhas Solicitações

7. Mas vamos fazer RBAC de verdade
Não será apenas:


if (user.role === 'ADMIN')


espalhado pelo código.
Vamos centralizar:

frontend/src/utils/permissions.js


e no backend:

backend/src/middlewares/roleMiddleware.js


Assim teremos duas camadas de proteção:

             REQUISIÇÃO
                  │
                  ▼
          ┌───────────────┐
          │ Autenticado?  │
          └───────┬───────┘
                  │
                 SIM
                  │
                  ▼
          ┌───────────────┐
          │ Tem permissão?│
          └───────┬───────┘
                  │
                 SIM
                  │
                  ▼
              CONTROLLER
                  │
                  ▼
               MYSQL

Isso é muito mais adequado para uma aplicação institucional.
8. Componentes globais
Também vamos manter a ideia da primeira estrutura.

Button

<Button>
  Salvar</Button>

Input

<Input
  label="CPF"
  placeholder="Digite seu CPF"/>

E esse Input será justamente uma evolução do componente que você acabou de me mostrar.
Ou seja, aquele efeito:

cursor → brilho → borda iluminada
será incorporado ao Input global da intranet.
Assim não precisamos recriar a animação em cada tela.
9. Máscaras
Teremos:

CPF
CNPJ
Telefone
CEP

Por exemplo:

CPF
000.000.000-00

CNPJ
00.000.000/0000-00

Telefone
(00) 00000-0000

CEP
00000-000

Tudo ficará em:

frontend/src/utils/masks.js


10. Banco de dados
Também vamos construir o banco pensando desde o início no sistema completo.
Uma primeira visão:

usuarios
    │
    ├── cargos
    │       │
    │       └── permissoes
    │
    ├── solicitacoes
    │
    └── atividades

Depois podemos evoluir para:

usuarios
cargos
permissoes
cargo_permissoes
solicitacoes
status_solicitacoes
atividades
configuracoes
notificacoes

11. Git/GitHub
Também vamos trabalhar com Git desde o começo.
A cada etapa importante:

feat: criar estrutura inicial
feat: criar layout da intranet
feat: implementar login
feat: conectar mysql
feat: implementar autenticacao
feat: implementar rbac
feat: criar dashboard
feat: criar gerenciamento de usuarios
feat: criar solicitacoes

Assim, se alguma parte der problema, conseguimos identificar qual alteração causou o problema.
12. Ordem que eu recomendo para desenvolver
Não vamos começar criando todas as páginas de uma vez.
A ordem será:

🟦 ETAPA 01 — Ambiente
VS Code
Git
GitHub
Node.js
XAMPP
MySQL

↓

🟦 ETAPA 02 — Estrutura
frontend
backend
database
docs

↓

🟦 ETAPA 03 — Banco
Banco JUCEPE
Usuários
Cargos
Permissões

↓

🟦 ETAPA 04 — Backend
Express
MySQL
API
Controllers
Routes
Middlewares

↓

🟦 ETAPA 05 — Frontend
React
Vite
Layouts
Componentes
Tema visual

↓

🟦 ETAPA 06 — Login
Aqui entra a animação que você aprovou.
↓

🟦 ETAPA 07 — Autenticação
Login
Cadastro
Logout
Recuperação
Redefinição

↓

🟦 ETAPA 08 — RBAC
ADMIN
GESTOR
USUARIO

↓

🟦 ETAPA 09 — Intranet
Header
Sidebar
Footer
Dashboard

↓

🟦 ETAPA 10 — Funcionalidades
Usuários
Solicitações
Aprovações
Relatórios
Perfil
Configurações
Permissões

13. E principalmente: vamos aprender enquanto construímos
Não vou tratar isso como simplesmente "gerar um código".
Vamos construir entendendo a relação:

React
 ↓
JavaScript
 ↓
HTTP
 ↓
Node.js
 ↓
Express
 ↓
SQL
 ↓
MySQL

E também:

VS Code
 ↓
Git
 ↓
GitHub
 ↓
Histórico do projeto


1. Arquitetura de segurança
Eu faria a Intranet TecnoTal com este modelo:

                    USUÁRIO
                       │
                       ▼
              ┌─────────────────┐
              │  REACT + VITE   │
              │                 │
              │ Validação UI    │
              └────────┬────────┘
                       │
                    HTTPS
                       │
                       ▼
              ┌─────────────────┐
              │   NODE.JS API   │
              │                 │
              │ ┌─────────────┐ │
              │ │ Rate Limit  │ │
              │ ├─────────────┤ │
              │ │ Auth        │ │
              │ ├─────────────┤ │
              │ │ RBAC        │ │
              │ ├─────────────┤ │
              │ │ Validation  │ │
              │ ├─────────────┤ │
              │ │ Audit Log   │ │
              │ └─────────────┘ │
              └────────┬────────┘
                       │
                  SQL parametrizado
                       │
                       ▼
              ┌─────────────────┐
              │     MySQL       │
              │                 │
              │ menor privilégio│
              └─────────────────┘

O ponto principal é:

O React nunca será responsável por decidir se alguém tem autorização para fazer alguma coisa.
Ele pode esconder um botão, mas a decisão definitiva acontece no backend Node.js.
2. Autenticação segura
Para login:

E-mail + senha
       ↓
Node.js
       ↓
Validação
       ↓
Busca usuário
       ↓
Verificação da senha
       ↓
Criação da sessão/token
       ↓
Acesso à Intranet

Nunca armazenaríamos:
senha = "123456"


No MySQL.
Usaremos hash de senha com bcryptjs.
Exemplo:


const bcrypt = require('bcryptjs')const senhaHash = await bcrypt.hash(senha, 12)

No banco fica algo parecido com:

$2b$12$...


E não a senha original.
3. Proteção contra SQL Injection
Esse é um dos pontos mais importantes.
❌ Nunca:


const sql = `
  SELECT * FROM usuarios
  WHERE email = '${email}'
`

Porque uma entrada maliciosa pode alterar a consulta.
Usaremos queries parametrizadas:


const [rows] = await db.execute(
  'SELECT * FROM usuarios WHERE email = ?',
  [email]
)

O valor fica separado da instrução SQL.
Isso deve ser um padrão obrigatório no backend inteiro.
4. RBAC no backend
Você já definiu:

ADMIN
GESTOR
USUARIO

Agora vamos transformar isso em segurança real.
Imagine:

/admin/permissoes


Um usuário comum tenta acessar diretamente:

https://sistema/admin/permissoes


O React pode até esconder o menu, mas isso não é suficiente.
O Node deverá verificar:

Está autenticado?
      │
      ├── NÃO → 401
      │
      ▼
Qual é o cargo?
      │
      ├── USUARIO → 403
      │
      ▼
ADMIN
      │
      ▼
Permitir acesso

Então teremos:

401 = não autenticado

403 = autenticado, mas sem permissão

5. Não confiar em dados vindos do frontend
Esse é um princípio importantíssimo.
Imagine que o React envie:


{
  "usuarioId": 15,
  "cargo": "ADMIN"
}

O backend não deve confiar nesse cargo.
Um atacante pode simplesmente modificar a requisição.
O servidor deve descobrir o usuário através da autenticação:

Token/Sessão
    ↓
Node.js
    ↓
Identifica usuário
    ↓
Consulta cargo/permissões
    ↓
Autoriza ação

6. Rate Limiting
Precisamos impedir tentativas automáticas de login.
Imagine alguém fazendo:

tentativa 1
tentativa 2
tentativa 3
...
tentativa 10.000

Nossa API deve limitar isso.
Por exemplo:

POST /api/auth/login

5 tentativas
      ↓
bloqueio temporário
      ↓
aguardar
      ↓
tentar novamente

No Node podemos utilizar middleware de rate limiting.
Isso também será aplicado a endpoints sensíveis, não somente ao login.
7. Validação de entrada
Todo dado recebido pelo backend deve ser validado.
Por exemplo:

CPF
CNPJ
E-mail
Telefone
CEP
Nome
Senha
IDs
Datas
Filtros

Não basta validar no React.
Teremos:

React
 ↓
validação UX
 ↓
Node.js
 ↓
validação de segurança
 ↓
MySQL

Se o frontend disser:

email = "abc"


o backend deve rejeitar.
8. Proteção contra XSS
Imagine alguém colocando no campo de nome:


<script>alert('teste')</script>


Nunca devemos permitir que isso seja interpretado como HTML executável.
No React, devemos evitar práticas perigosas como:


dangerouslySetInnerHTML


sem uma sanitização adequada.
Além disso, o backend deve validar os dados recebidos.
9. CORS
Nossa API será:

Node.js
localhost:3000

e o React:

localhost:5173


Precisamos controlar quem pode conversar com a API.
Em desenvolvimento podemos permitir:

http://localhost:5173


Mas em produção devemos configurar explicitamente o domínio autorizado.
Não vamos simplesmente colocar:


cors({
  origin: '*'
})

para uma aplicação autenticada.
10. Variáveis secretas
Informações como:

senha do MySQL
JWT secret
chaves
credenciais

não podem ficar no código.
❌ Nunca:


const senhaBanco = '123456'


Usaremos:

.env


Exemplo:


DB_HOST=localhost
DB_USER=...
DB_PASSWORD=...
DB_NAME=intranet_tecnotal

JWT_SECRET=...

E:

.env


fica fora do GitHub através do .gitignore.
11. Banco de dados com menor privilégio
Durante o desenvolvimento com XAMPP, muita gente usa:

root


Isso é aceitável para ambiente local, mas não é o modelo que eu adotaria para produção.
O ideal é criar um usuário específico para a aplicação:

intranet_app


com somente as permissões necessárias no banco da aplicação.
Assim, se a aplicação sofrer uma invasão, o atacante não ganha automaticamente acesso administrativo completo ao MySQL.
12. Proteção de sessão
Para a autenticação, precisamos decidir como manteremos a sessão.
Eu recomendo uma arquitetura baseada em cookie seguro, em vez de simplesmente armazenar um token sensível em localStorage.
Configurações importantes:

HttpOnly
Secure
SameSite

Por exemplo, em produção:

HttpOnly = impede acesso pelo JavaScript
Secure   = envia somente via HTTPS
SameSite = reduz determinados ataques cross-site

Isso é especialmente importante porque estamos construindo uma intranet institucional.
13. HTTPS
No ambiente local:

http://localhost


está tudo bem.
Em produção:

https://intranet.tecnotal...


deve ser obrigatório.
Principalmente porque estaremos transmitindo:

credenciais
dados pessoais
solicitações
informações administrativas

14. Proteção contra CSRF
Se usarmos autenticação por cookies, precisamos considerar CSRF.
O fluxo será protegido utilizando mecanismos como:

SameSite cookies
+
CSRF token quando necessário
+
validação de Origin/Referer

Não quero simplesmente adicionar uma biblioteca sem entender o motivo; vamos implementar isso quando chegarmos à autenticação.
15. Headers de segurança
O Node pode enviar headers de segurança.
Por exemplo, podemos utilizar middleware como helmet.
Isso ajuda com políticas como:

Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security

Isso cria uma camada adicional contra alguns tipos de ataque.
16. Logs de auditoria
Para uma intranet, eu considero isso essencial.
Precisamos saber:

QUEM?
  João Silva

FEZ O QUÊ?
  Alterou cargo de usuário

QUANDO?
  24/08/2026 12:31

DE ONDE?
  IP / sessão

RESULTADO?
  Sucesso

Podemos criar:

atividades


no MySQL.
Exemplo:

ID | Usuário | Ação              | Data
---|---------|-------------------|-------------------
1  | 15      | LOGIN              | ...
2  | 15      | UPDATE_USER        | ...
3  | 08      | APPROVE_REQUEST    | ...
4  | 15      | LOGOUT             | ...

Isso também será útil para a tela:

Relatórios de Atividade


que já está nos requisitos do sistema.
17. Não guardar informações sensíveis nos logs
Por exemplo, nunca:

senha
token completo
cookie
chaves secretas

nos logs.
Podemos registrar:

LOGIN_FAILED


mas não:

senha digitada: 123456


18. Proteção contra enumeração de usuários
Um detalhe que muitas aplicações esquecem.
Não queremos que alguém consiga descobrir quais e-mails existem.
Evitar respostas como:

"E-mail não existe."


versus:

"Senha incorreta."


Uma resposta genérica pode ser:

"E-mail ou senha inválidos."


Isso dificulta descobrir contas existentes.
19. Recuperação de senha
O fluxo também precisa ser seguro.
Não faremos:

/api/reset-password?id=15


e permitir que alguém simplesmente altere a senha.
Teremos um token temporário e de uso único:

Solicita recuperação
        ↓
Token aleatório
        ↓
Link temporário
        ↓
Usuário redefine senha
        ↓
Token invalidado

E nunca enviaremos a senha atual por e-mail.
20. Controle de arquivos
Caso futuramente a Intranet permita anexos, precisamos tratar:

PDF
DOCX
XLSX
JPG
PNG

com:


limite de tamanho;

extensão permitida;

MIME type;

nome aleatório;

armazenamento fora da pasta pública;

validação no backend.
Não devemos confiar apenas na extensão:

arquivo.jpg


pode não ser realmente uma imagem.
21. Segurança do próprio XAMPP
Durante o desenvolvimento:

XAMPP
├── Apache
└── MySQL

não devemos expor desnecessariamente o ambiente para a rede.
Principalmente:

phpMyAdmin
MySQL

não devem ficar acessíveis publicamente.
Em produção, eu não recomendaria simplesmente colocar o XAMPP diretamente na internet. O XAMPP será nosso ambiente de desenvolvimento local; a implantação final precisa ser planejada separadamente.
22. Uma regra que quero colocar no projeto
Vamos criar um documento:

docs/
└── seguranca.md

Nele teremos as regras oficiais:

POLÍTICA DE SEGURANÇA — INTRANET TECNOTAL

1. Nunca armazenar senhas em texto puro.
2. Utilizar queries parametrizadas.
3. Validar dados no frontend e backend.
4. Nunca confiar em permissões vindas do frontend.
5. RBAC obrigatório no backend.
6. Utilizar rate limiting em endpoints sensíveis.
7. Não armazenar secrets no Git.
8. Utilizar HTTPS em produção.
9. Utilizar cookies seguros para sessão.
10. Registrar ações administrativas.
11. Não registrar senhas ou tokens.
12. Aplicar princípio do menor privilégio.
13. Manter dependências atualizadas.
14. Não expor MySQL/phpMyAdmin publicamente.
15. Fazer backup periódico do banco.

23. Segurança em camadas
O mais importante é não depender de uma única proteção.
Nossa Intranet terá:

                 SEGURANÇA
                     │
       ┌─────────────┼──────────────┐
       │             │              │
       ▼             ▼              ▼
  FRONTEND        BACKEND        BANCO
       │             │              │
       │        ┌────┼────┐         │
       │        │    │    │         │
       │       Auth RBAC Rate       │
       │             │              │
       └─────────────┼──────────────┘
                     │
                 Validação
                     │
                 SQL seguro
                     │
                 Auditoria

Assim, se uma camada falhar, as outras continuam protegendo o sistema.

O que eu considero prioridade para nossa primeira versão
Antes de começarmos a criar as telas da Intranet TecnoTal, eu colocaria estes itens como obrigatórios:
🔴 Essenciais


Hash de senha com bcrypt.

Queries parametrizadas.

Autenticação segura.

RBAC no backend.

Validação de entrada.

Rate limiting.

CORS restritivo.
.env + secrets fora do Git.

Cookies seguros.

HTTPS em produção.

Logs de auditoria.

Princípio do menor privilégio no MySQL.
🟡 Segunda camada

13. Helmet/security headers.

14. CSRF protection.

15. Política de senha.

16. Bloqueio temporário após várias tentativas.

17. Expiração de sessão.

18. Backup do banco.

19. Monitoramento de erros.

20. Atualização periódica das dependências.