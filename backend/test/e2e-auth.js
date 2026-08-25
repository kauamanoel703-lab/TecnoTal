// Teste E2E do fluxo autenticado da API (cookie HttpOnly via fetch)
const base = 'http://localhost:3001';

async function main() {
  let cookie = '';

  // login admin
  const r = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tecnotal.com.br', senha: 'Admin@123' }),
  });
  cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  console.log('1 login:', r.status, '| cookie len:', cookie.length);

  const H = { Cookie: cookie, 'Content-Type': 'application/json' };

  // me
  const me = await fetch(base + '/api/auth/me', { headers: { Cookie: cookie } });
  console.log('2 /me:', me.status, JSON.stringify(await me.json()).slice(0, 120));

  // users sem auth
  const noAuth = await fetch(base + '/api/users');
  console.log('3 users sem auth (espera 401):', noAuth.status);

  // users com admin
  const users = await fetch(base + '/api/users', { headers: H });
  console.log('4 users (admin):', users.status);

  // criar maria gestora
  const maria = await fetch(base + '/api/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'Maria Gestora', email: 'maria@tecnotal.com.br', cpf: '52998224725', telefone: '(11) 98888-7777', senha: 'Gestor@123', cargoId: 2 }),
  });
  console.log('5 criar gestora:', maria.status, await maria.text());

  // cpf inválido
  const bad = await fetch(base + '/api/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'X', email: 'x@y.com', cpf: '11111111111', senha: 'Abcdefg1!' }),
  });
  console.log('6 cpf invalido (espera 400):', bad.status);

  // senha fraca
  const weak = await fetch(base + '/api/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'Y', email: 'y@y.com', cpf: '15350946056', senha: '123' }),
  });
  console.log('7 senha fraca (espera 400):', weak.status);

  // dashboard
  const dash = await fetch(base + '/api/reports/dashboard', { headers: { Cookie: cookie } });
  const dj = await dash.json();
  console.log('8 dashboard:', dash.status, JSON.stringify(dj.metricas));

  // login maria e abrir solicitação
  const rm = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maria@tecnotal.com.br', senha: 'Gestor@123' }),
  });
  const ckM = (rm.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  console.log('9 login maria:', rm.status);

  const sol = await fetch(base + '/api/requests', {
    method: 'POST', headers: { Cookie: ckM, 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: 'Férias 15 dias', descricao: '01/09 a 15/09' }),
  });
  console.log('10 criar solicitacao (maria):', sol.status, await sol.text());

  // maria NÃO pode acessar relatorios (403)
  const relM = await fetch(base + '/api/reports/atividades', { headers: { Cookie: ckM } });
  console.log('11 relatorios como gestor (espera 403):', relM.status);
}

main().catch((e) => { console.error('FALHA:', e.message); process.exit(1); });
