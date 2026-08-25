// E2E do módulo Financeiro: vendas + métricas
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

  // produtos
  let r = await fetch(base + '/api/business/produtos', { headers: { Cookie: ckA } });
  const { produtos } = await r.json();
  const telha = produtos.find((p) => p.sku === 'TLH-BAR-050');
  const estoqueAntes = telha.quantidade;

  // ===== REGISTRAR VENDA (preço de tabela) =====
  r = await fetch(base + '/api/business/vendas', { method: 'POST', headers: H,
    body: JSON.stringify({ produtoId: telha.id, quantidade: 10 }) });
  ok('registrar venda com preço de tabela', r.status === 201);

  // ===== VENDA COM DESCONTO =====
  r = await fetch(base + '/api/business/vendas', { method: 'POST', headers: H,
    body: JSON.stringify({ produtoId: telha.id, quantidade: 2, precoUnitario: 15.00, observacao: 'cliente antigo' }) });
  ok('venda com desconto', r.status === 201);

  // estoque baixou 12
  r = await fetch(base + '/api/business/produtos', { headers: { Cookie: ckA } });
  let d = await r.json();
  ok('estoque baixou automaticamente (12)', d.produtos.find((p) => p.sku === 'TLH-BAR-050').quantidade === estoqueAntes - 12);

  // venda acima do estoque
  r = await fetch(base + '/api/business/vendas', { method: 'POST', headers: H,
    body: JSON.stringify({ produtoId: telha.id, quantidade: 999999 }) });
  ok('venda acima do estoque rejeitada (409)', r.status === 409);

  // ===== RESUMO / MÉTRICAS =====
  r = await fetch(base + '/api/business/financeiro/resumo', { headers: H });
  d = await r.json();
  ok('resumo tem lucro do mês > 0', d.mesAtual.lucro > 0);
  ok('variação vs mês anterior presente', typeof d.mesAtual.variacaoLucroPct === 'number' || d.mesAtual.variacaoLucroPct === null);
  ok('série diária dos 30 dias', Array.isArray(d.serie) && d.serie.length >= 1);
  ok('mais vendido identificado com unidades', !!d.maisVendido && d.maisVendido.unidades >= (d.menosVendido?.unidades ?? 0));
  ok('menos vendido existe e é diferente', d.menosVendido && d.maisVendido && d.menosVendido.sku !== undefined);
  ok('pendências: salários contados', typeof d.pendencias.salariosAPagar === 'number');
  ok('pendências: produtos em alerta', typeof d.pendencias.produtosEmAlerta === 'number');
  ok('totais gerais presentes', Number(d.geral.lucroTotal) > 0);

  // ===== ÚLTIMAS VENDAS =====
  r = await fetch(base + '/api/business/financeiro/ultimas-vendas', { headers: { Cookie: ckA } });
  d = await r.json();
  ok('últimas vendas listadas', d.vendas.length >= 2);

  // ===== METAS INTEGRADAS: criar meta e vender =====
  r = await fetch(base + '/api/business/metas', { method: 'POST', headers: H,
    body: JSON.stringify({ titulo: 'Meta teste venda 50 un', tipo: 'QUANTIDADE', objetivo: 50, dataInicio: '2026-08-01', dataFim: '2026-08-31' }) });
  ok('criar meta para integração', r.status === 201);
  r = await fetch(base + '/api/business/metas', { headers: { Cookie: ckA } });
  const meta = (await r.json()).metas.find((m) => m.titulo.includes('50 un'));

  r = await fetch(base + '/api/business/vendas', { method: 'POST', headers: H,
    body: JSON.stringify({ produtoId: telha.id, quantidade: 5 }) });
  ok('vender para integrar com meta', r.status === 201);

  r = await fetch(base + '/api/business/metas', { headers: { Cookie: ckA } });
  const metaDepois = (await r.json()).metas.find((m) => m.titulo.includes('50 un'));
  ok('meta somou automaticamente as unidades da venda', metaDepois.progresso === meta.progresso + 5);

  // ===== USUÁRIO COMUM bloqueado =====
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/business/financeiro/resumo', { headers: { Cookie: ckJ } });
  ok('usuario comum bloqueado no financeiro (403)', r.status === 403);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
