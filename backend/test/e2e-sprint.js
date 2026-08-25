// Testa o sprint: editar usuário, notificações (fluxo completo) e filtros (dados)
const base = 'http://localhost:3001';
let pass = 0, fail = 0;
const ok = (nome, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} - ${nome}`); };

async function login(email, senha) {
  const r = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, senha }) });
  return (r.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
}

async function main() {
  const ckA = await login('admin@tecnotal.com.br', 'Admin@123');
  const H = { Cookie: ckA, 'Content-Type': 'application/json' };

  // ===== 1. EDITAR USUARIO =====
  let r = await fetch(base + '/api/users', { headers: { Cookie: ckA } });
  const { usuarios } = await r.json();
  const joao = usuarios.find((u) => u.email === 'joao@tecnotal.com.br');

  r = await fetch(base + `/api/users/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ nome: 'Joao Comum Editado', telefone: '(11) 91234-5678' }) });
  ok('editar usuario (nome/telefone)', r.ok);

  r = await fetch(base + `/api/users/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ cargoId: 2 }) });
  ok('editar usuario (mudar cargo)', r.ok);

  r = await fetch(base + '/api/users', { headers: { Cookie: ckA } });
  const depois = (await r.json()).usuarios.find((u) => u.email === 'joao@tecnotal.com.br');
  ok('cargo mudou para GESTOR', depois.cargo === 'GESTOR');

  // volta pro cargo original
  await fetch(base + `/api/users/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ nome: 'Joao Comum', cargoId: 3 }) });

  // ===== 2. NOTIFICACOES — fluxo completo =====
  // joao cria solicitação -> admin deve receber notificação
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/requests', { method: 'POST', headers: { Cookie: ckJ, 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: 'Teste notificacao sprint' }) });
  ok('joao cria solicitacao', r.status === 201);
  const solId = (await r.json()).id;

  r = await fetch(base + '/api/notifications', { headers: { Cookie: ckA } });
  let d = await r.json();
  ok('admin recebeu notificacao de nova solicitacao', d.naoLidas > 0 && d.notificacoes.some((n) => n.titulo === 'Nova solicitação'));

  // admin aprova -> joao deve receber notificação
  r = await fetch(`${base}/api/requests/${solId}/decidir`, { method: 'POST', headers: H,
    body: JSON.stringify({ acao: 'aprovar', observacao: 'Sprint test' }) });
  ok('admin decide solicitacao', r.ok);

  r = await fetch(base + '/api/notifications', { headers: { Cookie: ckJ } });
  d = await r.json();
  ok('joao recebeu notificacao da decisao', d.notificacoes.some((n) => n.titulo.includes('aprovada')));

  // marcar como lidas zera contador
  await fetch(base + '/api/notifications/ler-todas', { method: 'POST', headers: { Cookie: ckJ } });
  r = await fetch(base + '/api/notifications', { headers: { Cookie: ckJ } });
  d = await r.json();
  ok('ler-todas zera naoLidas', d.naoLidas === 0);

  // gestor sem auth não acessa nada
  r = await fetch(base + '/api/notifications');
  ok('notifications exige login (401)', r.status === 401);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
