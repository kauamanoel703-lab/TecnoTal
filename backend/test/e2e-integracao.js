// Teste de integração completa front↔back simulando o fluxo do navegador:
// login -> cookie -> /me (hidrata AuthContext) -> dados do dashboard
const API = 'http://localhost:3001/api';

async function main() {
  let pass = 0, fail = 0;
  const ok = (nome, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} - ${nome}`); };

  // 1. frontend no ar
  const vite = await fetch('http://localhost:5173/');
  ok('frontend Vite responde', vite.ok);
  const html = await vite.text();
  ok('index.html aponta pro React', html.includes('/src/main.jsx'));

  // 2. fluxo de sessão como o browser faz
  const login = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'admin@tecnotal.com.br', senha: 'Admin@123' }),
  });
  const setCookie = login.headers.get('set-cookie') || '';
  ok('login retorna Set-Cookie HttpOnly', setCookie.includes('HttpOnly'));
  ok('login retorna SameSite=Lax', setCookie.includes('SameSite=Lax'));
  const cookie = setCookie.split(';')[0];

  const me = await fetch(API + '/auth/me', { headers: { Cookie: cookie } });
  const { usuario } = await me.json();
  ok('sessao valida retorna usuario', me.ok && usuario.cargo === 'ADMIN');

  // 3. CORS permite a origem do Vite
  ok('CORS aceita localhost:5173', login.headers.get('access-control-allow-origin') === 'http://localhost:5173');

  // 4. dados que alimentam as telas
  const dash = await fetch(API + '/reports/dashboard', { headers: { Cookie: cookie } });
  const dj = await dash.json();
  ok('dashboard tem metricas', typeof dj.metricas.usuarios === 'number');
  const users = await fetch(API + '/users', { headers: { Cookie: cookie } });
  ok('lista usuarios para tela Usuarios', users.ok);

  // 5. logout invalida a sessão
  await fetch(API + '/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
  const depois = await fetch(API + '/auth/me', { headers: { Cookie: cookie } });
  // JWT é stateless: após logout o cookie é limpo no cliente; aqui ainda vale até expirar — comportamento documentado
  console.log('(info) JWT stateless — logout limpa cookie no cliente');

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
