const { Parser } = require('@json2csv/plainjs');
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

function enviarCSV(res, nomeArquivo, campos, dados) {
  const parser = new Parser({ fields: campos, delimiter: ';', withBOM: true }); // Excel BR-friendly
  const csv = parser.parse(dados);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
  res.send(csv);
}

// GET /api/reports/atividades.csv?limite=1000
async function exportarAtividades(req, res, next) {
  try {
    const limite = Math.min(5000, Number(req.query.limite) || 1000);
    const [rows] = await db.execute(
      `SELECT a.id, u.nome AS usuario, u.email, a.acao, a.detalhes, a.ip,
              DATE_FORMAT(a.criado_em, '%d/%m/%Y %H:%i:%s') AS data_hora
         FROM atividades a LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.criado_em DESC LIMIT ?`,
      [limite]
    );
    await registrarAtividade(req.user.id, 'EXPORTAR_RELATORIO', `atividades (${rows.length} linhas)`, req.ip);
    enviarCSV(res, `atividades_tecnotal_${Date.now()}.csv`,
      ['id', 'usuario', 'email', 'acao', 'detalhes', 'ip', 'data_hora'], rows);
  } catch (err) { next(err); }
}

// GET /api/reports/usuarios.csv
async function exportarUsuarios(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nome, u.email, u.cpf, c.nome AS cargo, IF(u.ativo,'Ativo','Inativo') AS status,
              DATE_FORMAT(u.criado_em, '%d/%m/%Y') AS cadastrado_em
         FROM usuarios u JOIN cargos c ON c.id = u.cargo_id ORDER BY u.id`
    );
    await registrarAtividade(req.user.id, 'EXPORTAR_RELATORIO', `usuarios (${rows.length})`, req.ip);
    enviarCSV(res, `usuarios_tecnotal_${Date.now()}.csv`,
      ['id', 'nome', 'email', 'cpf', 'cargo', 'status', 'cadastrado_em'], rows);
  } catch (err) { next(err); }
}

// GET /api/reports/solicitacoes.csv
async function exportarSolicitacoes(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT s.id, u.nome AS usuario, s.titulo, st.nome AS status,
              IFNULL(a.nome,'—') AS decidido_por, IFNULL(s.resposta,'—') AS observacao,
              DATE_FORMAT(s.criado_em, '%d/%m/%Y %H:%i') AS criada_em,
              DATE_FORMAT(s.decidido_em, '%d/%m/%Y %H:%i') AS decidida_em
         FROM solicitacoes s
         JOIN usuarios u ON u.id = s.usuario_id
         JOIN status_solicitacoes st ON st.id = s.status_id
         LEFT JOIN usuarios a ON a.id = s.aprovador_id
        ORDER BY s.criado_em DESC`
    );
    await registrarAtividade(req.user.id, 'EXPORTAR_RELATORIO', `solicitacoes (${rows.length})`, req.ip);
    enviarCSV(res, `solicitacoes_tecnotal_${Date.now()}.csv`,
      ['id', 'usuario', 'titulo', 'status', 'decidido_por', 'observacao', 'criada_em', 'decidida_em'], rows);
  } catch (err) { next(err); }
}

module.exports = { exportarAtividades, exportarUsuarios, exportarSolicitacoes };
