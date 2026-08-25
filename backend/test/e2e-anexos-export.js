// Testa anexos (upload seguro, download autenticado) e exportação CSV
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
  const H = { Cookie: ckA };

  // pega a solicitação mais recente do admin
  let r = await fetch(base + '/api/requests/minhas', { headers: H });
  const { solicitacoes } = await r.json();
  const sol = solicitacoes[0];
  ok('existe solicitacao para testar', !!sol);
  if (!sol) return;

  // ===== UPLOAD: PDF válido =====
  // %PDF + lixo = PDF "real" pro magic check
  const pdfFake = Buffer.concat([Buffer.from('%PDF-1.4\n'), crypto.randomBytes(200)]);
  let fd = new FormData();
  fd.append('anexos', new Blob([pdfFake], { type: 'application/pdf' }), 'documento.pdf');
  r = await fetch(`${base}/api/requests/${sol.id}/anexos`, { method: 'POST', headers: H, body: fd });
  ok('upload de PDF valido (201)', r.status === 201);

  // ===== UPLOAD REJEITADO: .pdf que na verdade é texto (magic bytes errados) =====
  fd = new FormData();
  fd.append('anexos', new Blob([Buffer.from('<script>alert(1)</script>isso nao e um pdf')], { type: 'application/pdf' }), 'fake.pdf');
  r = await fetch(`${base}/api/requests/${sol.id}/anexos`, { method: 'POST', headers: H, body: fd });
  ok('arquivo fake rejeitado pelo MIME real (400)', r.status === 400);

  // ===== EXTENSÃO perigosa =====
  fd = new FormData();
  fd.append('anexos', new Blob([Buffer.from('malware')], { type: 'application/octet-stream' }), 'virus.exe');
  r = await fetch(`${base}/api/requests/${sol.id}/anexos`, { method: 'POST', headers: H, body: fd });
  ok('.exe rejeitado (400)', r.status === 400);

  // ===== LISTAR =====
  r = await fetch(`${base}/api/requests/${sol.id}/anexos`, { headers: H });
  const { anexos } = await r.json();
  ok('listar anexos mostra o PDF', anexos.length >= 1 && anexos.some((a) => a.nome_original === 'documento.pdf'));

  // ===== DOWNLOAD autenticado =====
  r = await fetch(`${base}/api/anexos/${anexos[0].id}/download`, { headers: H });
  const bytes = Buffer.from(await r.arrayBuffer());
  ok('download autenticado retorna o conteudo', r.ok && bytes.slice(0, 4).toString() === '%PDF');
  ok('Content-Disposition com nome original', (r.headers.get('content-disposition') || '').includes('documento.pdf'));

  // download sem login = 401
  r = await fetch(`${base}/api/anexos/${anexos[0].id}/download`);
  ok('download sem login bloqueado (401)', r.status === 401);

  // ===== EXPORTACAO CSV =====
  r = await fetch(base + '/api/reports/atividades.csv', { headers: H });
  const csv1 = await r.text();
  ok('export atividades.csv', r.ok && csv1.includes('usuario') && csv1.includes(';'));

  r = await fetch(base + '/api/reports/solicitacoes.csv', { headers: H });
  const csv2 = await r.text();
  ok('export solicitacoes.csv', r.ok && csv2.includes('decidido_por') && csv2.length > 50);

  r = await fetch(base + '/api/reports/usuarios.csv', { headers: H });
  const csv3 = await r.text();
  ok('export usuarios.csv', r.ok && csv3.includes('admin@tecnotal.com.br'));

  // USUARIO comum NÃO exporta
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/reports/atividades.csv', { headers: { Cookie: ckJ } });
  ok('usuario comum bloqueado no export (403)', r.status === 403);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
