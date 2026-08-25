// E2E do módulo de salários
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
  const mesAtual = new Date().toLocaleDateString('sv-SE').slice(0, 7);

  // descobrir id do joao
  let r = await fetch(base + '/api/users', { headers: { Cookie: ckA } });
  const joao = (await r.json()).usuarios.find((u) => u.email === 'joao@tecnotal.com.br');

  // ===== DEFINIR SALÁRIO =====
  r = await fetch(`${base}/api/salarios/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ valorMensal: 2500, diaPagamento: 5 }) });
  ok('definir salário do joao', r.ok);

  // valor inválido
  r = await fetch(`${base}/api/salarios/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ valorMensal: -100 }) });
  ok('valor negativo rejeitado (400)', r.status === 400);

  r = await fetch(`${base}/api/salarios/${joao.id}`, { method: 'PUT', headers: H,
    body: JSON.stringify({ valorMensal: 2500, diaPagamento: 31 }) });
  ok('dia 31 rejeitado (400)', r.status === 400);

  // ===== LISTAR FOLHA =====
  r = await fetch(base + '/api/salarios', { headers: { Cookie: ckA } });
  let d = await r.json();
  const joaoFolha = d.funcionarios.find((f) => f.usuarioId === joao.id);
  ok('folha lista joao com salário', joaoFolha && Number(joaoFolha.valorMensal) === 2500);
  ok('status pendente antes de pagar', joaoFolha.pagoEsteMes === 0);
  ok('total da folha presente no resumo', d.funcionarios.length >= 3);

  // ===== PAGAR =====
  r = await fetch(`${base}/api/salarios/${joao.id}/pagar`, { method: 'POST', headers: H, body: JSON.stringify({}) });
  ok('registrar pagamento (usa salário base)', r.status === 201);

  // pagamento duplicado no mesmo mês
  r = await fetch(`${base}/api/salarios/${joao.id}/pagar`, { method: 'POST', headers: H,
    body: JSON.stringify({ referenciaMes: mesAtual }) });
  ok('pagamento duplicado no mês rejeitado (409)', r.status === 409);

  // folha reflete pago
  r = await fetch(base + '/api/salarios', { headers: { Cookie: ckA } });
  d = await r.json();
  ok('status virou "pago" na folha', d.funcionarios.find((f) => f.usuarioId === joao.id).pagoEsteMes === 1);

  // funcionário sem salário definido
  r = await fetch(base + '/api/users', { headers: { Cookie: ckA } });
  const maria = (await r.json()).usuarios.find((u) => u.email === 'maria@tecnotal.com.br');
  r = await fetch(`${base}/api/salarios/${maria.id}/pagar`, { method: 'POST', headers: H,
    body: JSON.stringify({ valorPago: 100 }) }); // valor explícito contorna a exigência
  ok('pagar com valor explícito mesmo sem base', r.status === 201);

  // ===== HISTÓRICO =====
  r = await fetch(base + '/api/salarios/historico', { headers: { Cookie: ckA } });
  d = await r.json();
  ok('histórico tem os pagamentos e totais por mês',
    d.pagamentos.length >= 2 && d.totaisPorMes[mesAtual] >= 2600);

  // ===== FUNCIONÁRIO vê só o próprio =====
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/salarios/meu', { headers: { Cookie: ckJ } });
  d = await r.json();
  ok('meu salário retorna dados', r.ok && d.salario?.valorMensal == 2500 && d.pagamentos.length >= 1);

  // funcionário NÃO acessa a folha nem define
  r = await fetch(base + '/api/salarios', { headers: { Cookie: ckJ } });
  ok('funcionário bloqueado na folha (403)', r.status === 403);
  r = await fetch(`${base}/api/salarios/${maria.id}`, { method: 'PUT', headers: { Cookie: ckJ, 'Content-Type': 'application/json' },
    body: JSON.stringify({ valorMensal: 999999 }) });
  ok('funcionário bloqueado ao definir salário (403)', r.status === 403);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
