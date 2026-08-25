// Teste RBAC: usuário comum bloqueado, admin aprova a solicitação pendente mais recente
const base = 'http://localhost:3001';

async function login(email, senha) {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  return (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
}

async function main() {
  const ckA = await login('admin@tecnotal.com.br', 'Admin@123');

  // criar usuário comum
  await fetch(base + '/api/users', { method: 'POST', headers: { Cookie: ckA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Joao Comum', email: 'joao2@tecnotal.com.br', cpf: '11144477735', senha: 'Comum@123', cargoId: 3 }) });
  const ckU = await login('joao2@tecnotal.com.br', 'Comum@123');

  let r = await fetch(base + '/api/users', { headers: { Cookie: ckU } });
  console.log('usuario lista users (espera 403):', r.status);

  r = await fetch(base + '/api/reports/atividades', { headers: { Cookie: ckU } });
  console.log('usuario relatorios (espera 403):', r.status);

  // joao cria uma solicitação
  r = await fetch(base + '/api/requests', { method: 'POST', headers: { Cookie: ckU, 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: 'Home office teste' }) });
  const criada = (await r.json()).id;

  // joao tenta decidir
  r = await fetch(`${base}/api/requests/${criada}/decidir`, { method: 'POST', headers: { Cookie: ckU, 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'aprovar' }) });
  console.log('usuario decide solicitacao (espera 403):', r.status);

  // admin aprova
  r = await fetch(`${base}/api/requests/${criada}/decidir`, { method: 'POST', headers: { Cookie: ckA, 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'aprovar', observacao: 'Aprovado' }) });
  console.log('admin aprova solicitacao (espera 200):', r.status);

  // logout
  r = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: ckA } });
  console.log('logout (espera 200):', r.status);
}

main().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
