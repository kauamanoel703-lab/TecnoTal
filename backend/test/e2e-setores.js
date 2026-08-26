// E2E: documentos (adm), inventário/servidores/saúde (TI), salários com área/nível
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
  const HJ = { 'Content-Type': 'application/json', Cookie: ckA };

  // ===== LOGIN dos usuários de setor =====
  const ckTI = await login('ti@tecnotal.com.br', 'Ti@12345');
  ok('login TI demo', !!ckTI);
  const ckADM = await login('adm@tecnotal.com.br', 'Adm@12345');
  ok('login Administrativo demo', !!ckADM);

  // ===== DOCUMENTOS =====
  // upload PDF válido pelo admin
  const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), crypto.randomBytes(100)]);
  let fd = new FormData();
  fd.append('arquivos', new Blob([pdf], { type: 'application/pdf' }), 'politica-empresa.pdf');
  fd.append('titulo', 'Política interna 2026');
  fd.append('categoria', 'Política');
  fd.append('visivelPara', 'TODOS');
  r = await fetch(base + '/api/setores/docs', { method: 'POST', headers: { Cookie: ckA }, body: fd });
  ok('upload documento', r.status === 201);

  r = await fetch(base + '/api/setores/docs', { headers: { Cookie: ckA } });
  let d = await r.json();
  ok('listar documentos', d.documentos.length >= 1);
  const doc = d.documentos[0];

  // download autenticado
  r = await fetch(`${base}/api/setores/docs/${doc.id}/download`, { headers: { Cookie: ckA } });
  ok('download do documento', r.ok);

  // usuário comum vê docs TODOS mas não pode enviar
  const ckJ = await login('joao@tecnotal.com.br', 'Comum@123');
  r = await fetch(base + '/api/setores/docs', { headers: { Cookie: ckJ } });
  d = await r.json();
  ok('comum vê documentos públicos', d.documentos.length >= 1);
  fd = new FormData();
  fd.append('arquivos', new Blob([Buffer.from('x')], { type: 'text/plain' }), 'x.txt');
  r = await fetch(base + '/api/setores/docs', { method: 'POST', headers: { Cookie: ckJ }, body: fd });
  ok('comum não publica documento (403)', r.status === 403);

  // ===== TI: INVENTÁRIO =====
  r = await fetch(base + '/api/setores/ti/inventario', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ckTI },
    body: JSON.stringify({ tipo: 'Notebook', marcaModelo: 'Dell Latitude 3420', numeroSerie: 'SN-TESTE-001' }) });
  ok('TI cadastra equipamento', r.status === 201);

  r = await fetch(base + '/api/setores/ti/inventario', { headers: { Cookie: ckTI } });
  d = await r.json();
  ok('inventario lista equipamento', d.equipamentos.length >= 1);

  // joao não acessa área TI
  r = await fetch(base + '/api/setores/ti/inventario', { headers: { Cookie: ckJ } });
  ok('comum bloqueado na T.I. (403)', r.status === 403);

  // ===== TI: SERVIDORES =====
  r = await fetch(base + '/api/setores/ti/servidores', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ckTI },
    body: JSON.stringify({ nome: 'srv-intranet-01', funcao: 'Intranet', ip: '192.168.0.50', sistema: 'Ubuntu 22.04' }) });
  ok('TI cadastra servidor', r.status === 201);

  r = await fetch(base + '/api/setores/ti/servidores', { headers: { Cookie: ckTI } });
  d = await r.json();
  const srv = d.servidores.find((s) => s.nome === 'srv-intranet-01');

  r = await fetch(`${base}/api/setores/ti/servidores/${srv.id}/status`, { method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: ckTI }, body: JSON.stringify({ status: 'MANUTENCAO' }) });
  ok('mudar status servidor', r.ok);

  // ===== SAÚDE =====
  r = await fetch(base + '/api/setores/ti/saude', { headers: { Cookie: ckTI } });
  d = await r.json();
  ok('saude da intranet', r.ok && d.api.status === 'ONLINE' && d.banco.status === 'ONLINE');

  // ===== SALÁRIOS com área/nível =====
  r = await fetch(base + '/api/users', { headers: H });
  const { usuarios } = await r.json();
  const tiUser = usuarios.find((u) => u.email === 'ti@tecnotal.com.br');

  r = await fetch(`${base}/api/salarios/${tiUser.id}`, { method: 'PUT', headers: HJ,
    body: JSON.stringify({ valorMensal: 4500, nivel: 'SENIOR', departamento: 'TI', diaPagamento: 5 }) });
  ok('definir salário com área e nível', r.ok);

  r = await fetch(base + '/api/salarios', { headers: H });
  d = await r.json();
  const tiFolha = d.funcionarios.find((f) => f.usuarioId === tiUser.id);
  ok('folha mostra nível e área', tiFolha.nivel === 'SENIOR' && tiFolha.departamento === 'TI');
  ok('totais por departamento presentes', typeof d.totaisPorDepto === 'object' && d.totaisPorDepto.TI > 0);

  // pagar e conferir histórico com filtro
  await fetch(`${base}/api/salarios/${tiUser.id}/pagar`, { method: 'POST', headers: HJ, body: JSON.stringify({}) });
  r = await fetch(base + '/api/salarios/historico?departamento=TI', { headers: H });
  d = await r.json();
  ok('histórico filtra por área', d.pagamentos.every((p) => p.departamento === 'TI') && d.pagamentos.length >= 1);

  console.log(`\n=== RESULTADO: ${pass} passou, ${fail} falhou ===`);
}
main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
