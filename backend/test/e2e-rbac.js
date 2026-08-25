const base = 'http://localhost:3001';
async function login(email, senha) {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  return (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
}
async function main() {
  const ckA = await login('admin@tecnotal.com.br', 'Admin@123');
  // criar usuário comum
  await fetch(base + '/api/users', { method: 'POST', headers: { Cookie: ckA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Joao Comum', email: 'joao@tecnotal.com.br', cpf: '11144477735', senha: 'Comum@123', cargoId: 3 }) });
  const ckU = await login('joao@tecnotal.com.br', 'Comum@123');
  const t1 = await fetch(base + '/api/users', { headers: { Cookie: ckU } });
  console.log('usuario lista users (espera 403):', t1.status);
  const t2 = await fetch(base + '/api/requests/2/decidir', { method: 'POST', headers: { Cookie: ckU, 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'aprovar' }) });
  console.log('usuario decide solicitacao (espera 403):', t2.status);
  const t3 = await fetch(base + '/api/reports/dashboard', { headers: { Cookie: ckU } });
  console.log('usuario dashboard (espera 200):', t3.status);
  // admin decide a solicitacao da maria (id=2)
  const t4 = await fetch(base + '/api/requests/2/decidir', { method: 'POST', headers: { Cookie: ckA, 'Content-Type': 'application/json' }, body: JSON.stringify({ acao: 'aprovar', observacao: 'Aprovado' }) });
  console.log('admin aprova solicitacao (espera 200):', t4.status, await t4.text());
  // logout
  const t5 = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { Cookie: ckA } });
  console.log('logout (espera 200):', t5.status);
}
main().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
