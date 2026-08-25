// Testa recuperação de senha + admin (configurações e cargos/permissões)
const base = 'http://localhost:3001';
let pass = 0, fail = 0;
const ok = (nome, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} - ${nome}`); };

async function login(email, senha) {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  return (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
}

async function main() {
  // ===== RECUPERAÇÃO DE SENHA =====
  let r = await fetch(base + '/api/auth/recuperar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@tecnotal.com.br' }) });
  let d = await r.json();
  ok('recuperar gera token', r.ok && !!d.token);
  const token = d.token;

  // senha inválida (não tem especial)
  r = await fetch(base + '/api/auth/redefinir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, novaSenha: 'NovaSenha1' }) });
  ok('redefinir rejeita senha sem especial (400)', r.status === 400);

  // redefinir de verdade (senha com exatamente 8 chars)
  r = await fetch(base + '/api/auth/redefinir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, novaSenha: 'Admin@23' }) });
  ok('redefinir com senha válida (200)', r.ok);

  // mesmo token não pode ser reutilizado (uso único)
  r = await fetch(base + '/api/auth/redefinir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, novaSenha: 'Outra@123' }) });
  ok('token é de uso unico (400 na 2a vez)', r.status === 400);

  // login com a senha redefinida funciona
  const ckA = await login('admin@tecnotal.com.br', 'Admin@23');
  ok('login apos redefinir', !!ckA);
  const H = { Cookie: ckA, 'Content-Type': 'application/json' };

  // e-mail inexistente responde genérico SEM token
  r = await fetch(base + '/api/auth/recuperar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'fantasma@x.com' }) });
  d = await r.json();
  ok('email inexistente nao vaza token', r.ok && !d.token);

  // ===== ADMIN =====
  r = await fetch(base + '/api/admin/configuracoes', { headers: H });
  d = await r.json();
  ok('listar configuracoes', r.ok && !!d.configuracoes.length);

  r = await fetch(base + '/api/admin/configuracoes', { method: 'PUT', headers: H, body: JSON.stringify({ nome_sistema: 'Intranet TecnoTal' }) });
  ok('salvar configuracao', r.ok);

  r = await fetch(base + '/api/admin/cargos', { headers: H });
  d = await r.json();
  ok('listar cargos com permissoes', r.ok && d.cargos.length === 3);
  ok('ADMIN tem todas as permissoes', d.cargos[0].permissoes.length === 11);

  // gestor NÃO acessa admin
  const ckM = await login('maria@tecnotal.com.br', 'Gestor@123');
  r = await fetch(base + '/api/admin/configuracoes', { headers: { Cookie: ckM } });
  ok('gestor bloqueado em admin (403)', r.status === 403);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
