// E2E: chamados (RH/TI/Administrativo) + regra de cargos (só ADMIN e RH)
const base = 'http://localhost:3001';
let pass = 0, fail = 0;
const ok = (nome, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} - ${nome}`); };

async function login(email, senha) {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  return (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
}

async function main() {
  // ===== CRIAR USUÁRIO DO RH =====
  const ckA = await login('admin@tecnotal.com.br', 'Admin@123');
  let H = { Cookie: ckA, 'Content-Type': 'application/json' };

  let r = await fetch(base + '/api/users', { method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'Ana RH', email: 'rh@tecnotal.com.br', cpf: '39053344705', senha: 'Rh@12345', cargoId: 4 }) });
  ok('criar usuário do RH (ou já existe)', [201,409].includes(r.status));

  const ckRH = await login('rh@tecnotal.com.br', 'Rh@12345');
  ok('login RH funciona', !!ckRH);
  H = { Cookie: ckRH, 'Content-Type': 'application/json' };

  // ===== REGRA DE CARGO: RH define =====
  r = await fetch(base + '/api/users', { headers: { Cookie: ckRH } });
  const { usuarios } = await r.json();
  const joao = usuarios.find((u) => u.email === 'joao@tecnotal.com.br');

  r = await fetch(`${base}/api/users/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ cargoId: 2 }) }); // promove joao a GESTOR
  ok('RH define cargo de funcionário', r.ok);
  // volta pra USUARIO
  await fetch(`${base}/api/users/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ cargoId: 3 }) });

  // GESTOR tenta definir cargo — deve ser bloqueado
  const ckM = await login('maria@tecnotal.com.br', 'Gestor@123');
  r = await fetch(`${base}/api/users/${joao.id}`, { method: 'PUT', headers: { Cookie: ckM, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cargoId: 1 }) });
  ok('GESTOR não define cargo (403)', r.status === 403);

  // ===== CHAMADOS =====
  // joao abre chamado pra TI
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/chamados', { method: 'POST', headers: { Cookie: ckJ, 'Content-Type': 'application/json' },
    body: JSON.stringify({ departamento: 'TI', titulo: 'Computador não liga', descricao: 'Da fonte queimada', prioridade: 'ALTA' }) });
  ok('abrir chamado TI', r.status === 201);
  const chamadoTI = (await r.json()).id;

  // maria abre chamado pro RH
  r = await fetch(base + '/api/chamados', { method: 'POST', headers: { Cookie: ckM, 'Content-Type': 'application/json' },
    body: JSON.stringify({ departamento: 'RH', titulo: 'Dúvida sobre férias', prioridade: 'BAIXA' }) });
  ok('abrir chamado RH', r.status === 201);
  const chamadoRH = (await r.json()).id;

  // admin vê todos
  r = await fetch(base + '/api/chamados', { headers: { Cookie: ckA } });
  d = await r.json();
  ok('admin vê todos os chamados', d.chamados.length >= 2);

  // RH vê o do RH mas NÃO atende o de TI
  r = await fetch(base + '/api/chamados?departamento=RH', { headers: { Cookie: ckRH } });
  d = await r.json();
  ok('RH filtra sua fila', d.chamados.every((c) => c.departamento === 'RH'));

  r = await fetch(`${base}/api/chamados/${chamadoTI}/assumir`, { method: 'POST', headers: { Cookie: ckRH } });
  ok('RH não assume chamado de TI (403)', r.status === 403);

  // RH assume e resolve o seu
  r = await fetch(`${base}/api/chamados/${chamadoRH}/assumir`, { method: 'POST', headers: { Cookie: ckRH } });
  ok('RH assume chamado do setor', r.ok);
  r = await fetch(`${base}/api/chamados/${chamadoRH}/resolver`, { method: 'POST', headers: { Cookie: ckRH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resposta: '30 dias de férias após 12 meses, conforme CLT' }) });
  ok('RH resolve com resposta', r.ok);

  // assumir chamado já resolvido
  r = await fetch(`${base}/api/chamados/${chamadoRH}/assumir`, { method: 'POST', headers: { Cookie: ckRH } });
  ok('não reassume resolvido (409)', r.status === 409);

  // notificação chegou pro joao (dono do chamado de TI ainda aberto)
  r = await fetch(base + '/api/notifications', { headers: { Cookie: ckJ } });

  // meus-setores
  r = await fetch(base + '/api/chamados/meus-setores', { headers: { Cookie: ckRH } });
  d = await r.json();
  ok('setores do RH = [RH]', d.setores.includes('RH') && !d.setores.includes('TI'));

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
