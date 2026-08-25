// E2E dos módulos de negócio: produtos, metas e ponto
const crypto = require('crypto');
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
  const HG = { Cookie: ckA }; // sem json

  // ===== PRODUTOS =====
  let r = await fetch(base + '/api/business/produtos', { headers: HG });
  let d = await r.json();
  ok('listar produtos (5 seed)', r.ok && d.produtos.length >= 5);
  const telha = d.produtos.find((p) => p.sku === 'TLH-BAR-050');
  ok('alerta de estoque funciona', d.produtos.some((p) => p.alertaEstoque)); // disjuntor tem 8 < 15

  r = await fetch(base + '/api/business/produtos', { method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'Tinta Acrílica 18L', sku: 'TNT-ACR-018', categoria: 'Pintura', precoCusto: 120, precoVenda: 189.9, quantidade: 30, estoqueMinimo: 8 }) });
  ok('criar produto', r.status === 201);

  r = await fetch(base + '/api/business/produtos', { method: 'POST', headers: H,
    body: JSON.stringify({ nome: 'Dup', sku: 'TNT-ACR-018' }) });
  ok('SKU duplicado rejeitado (409)', r.status === 409);

  // saída maior que estoque
  r = await fetch(`${base}/api/business/produtos/${telha.id}/movimentar`, { method: 'POST', headers: H,
    body: JSON.stringify({ tipo: 'SAIDA', quantidade: 99999 }) });
  ok('saida acima do estoque rejeitada (409)', r.status === 409);

  // saída normal
  r = await fetch(`${base}/api/business/produtos/${telha.id}/movimentar`, { method: 'POST', headers: H,
    body: JSON.stringify({ tipo: 'SAIDA', quantidade: 20, observacao: 'Obra centro' }) });
  ok('saida de 20 unidades', r.ok);
  r = await fetch(base + '/api/business/produtos', { headers: HG });
  d = await r.json();
  ok('estoque diminuiu', d.produtos.find((p) => p.sku === 'TLH-BAR-050').quantidade === telha.quantidade - 20);

  // usuário comum NÃO movimenta
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(`${base}/api/business/produtos/${telha.id}/movimentar`, { method: 'POST', headers: { Cookie: ckJ, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: 'ENTRADA', quantidade: 1 }) });
  ok('usuario comum bloqueado no estoque (403)', r.status === 403);

  // ===== METAS =====
  r = await fetch(base + '/api/business/metas', { method: 'POST', headers: H,
    body: JSON.stringify({ titulo: 'Vender 100 telhas em agosto', tipo: 'QUANTIDADE', objetivo: 100, dataInicio: '2026-08-01', dataFim: '2026-08-31' }) });
  ok('criar meta', r.status === 201);

  r = await fetch(base + '/api/business/metas', { headers: HG });
  d = await r.json();
  const meta = d.metas.find((m) => m.titulo.includes('100 telhas'));
  ok('meta listada com percentual 0%', meta && meta.percentual === 0);

  r = await fetch(`${base}/api/business/metas/${meta.id}/progresso`, { method: 'POST', headers: H,
    body: JSON.stringify({ progresso: 60, incremento: true }) });
  ok('somar progresso +60', r.ok);

  r = await fetch(`${base}/api/business/metas/${meta.id}/progresso`, { method: 'POST', headers: H,
    body: JSON.stringify({ progresso: 50, incremento: true }) });
  d = await r.json();
  ok('atingiu objetivo => concluida', d.concluida === true);

  r = await fetch(base + '/api/business/metas', { headers: HG });
  d = await r.json();
  const metaBatida = d.metas.find((m) => m.titulo.includes('100 telhas'));
  ok('percentual capped em 100%', metaBatida.percentual === 100);

  // datas invalidas
  r = await fetch(base + '/api/business/metas', { method: 'POST', headers: H,
    body: JSON.stringify({ titulo: 'X', objetivo: 10, dataInicio: '2026-09-10', dataFim: '2026-09-01' }) });
  ok('data fim antes do inicio rejeitada (400)', r.status === 400);

  // ===== PONTO =====
  r = await fetch(base + '/api/business/ponto/bater', { method: 'POST', headers: H });
  d = await r.json();
  ok('bater entrada', r.ok && (d.tipo === 'ENTRADA' || d.erro?.includes('completo')));

  r = await fetch(base + '/api/business/ponto/meu', { headers: HG });
  d = await r.json();
  ok('meus registros aparecem', r.ok && d.registros.length >= 1);

  r = await fetch(base + '/api/business/ponto/equipe', { headers: HG });
  d = await r.json();
  ok('visao da equipe para gestor', r.ok && d.funcionarios.length >= 2);

  // usuario comum não vê a equipe
  r = await fetch(base + '/api/business/ponto/equipe', { headers: { Cookie: ckJ } });
  ok('usuario comum bloqueado na equipe (403)', r.status === 403);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
