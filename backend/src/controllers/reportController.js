const db = require('../database/connection');

// GET /api/reports/dashboard — métricas para cards
async function dashboard(req, res, next) {
  try {
    const [[{ usuarios }]] = await db.execute('SELECT COUNT(*) usuarios FROM usuarios WHERE ativo = 1');
    const [[{ pendentes }]] = await db.execute(
      "SELECT COUNT(*) pendentes FROM solicitacoes WHERE status_id = 1");
    const [[{ aprovadas }]] = await db.execute(
      "SELECT COUNT(*) aprovadas FROM solicitacoes WHERE status_id = 2");
    const [[{ atividadesHoje }]] = await db.execute(
      'SELECT COUNT(*) atividadesHoje FROM atividades WHERE DATE(criado_em) = CURDATE()');

    // atividade dos últimos 7 dias
    const [serie] = await db.execute(
      `SELECT DATE(criado_em) dia, COUNT(*) total
         FROM atividades
        WHERE criado_em >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(criado_em) ORDER BY dia`);

    const [recentes] = await db.execute(
      `SELECT a.acao, a.detalhes, a.criado_em, u.nome AS usuario
         FROM atividades a LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.criado_em DESC LIMIT 10`);

    res.json({
      metricas: { usuarios, pendentes, aprovadas, atividadesHoje },
      serie,
      recentes,
    });
  } catch (err) { next(err); }
}

// GET /api/reports/atividades — auditoria paginada
async function atividades(req, res, next) {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = 20;
    const offset = (pagina - 1) * porPagina;
    const [rows] = await db.execute(
      `SELECT a.id, a.acao, a.detalhes, a.ip, a.criado_em, u.nome AS usuario
         FROM atividades a LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.criado_em DESC LIMIT ? OFFSET ?`,
      [porPagina, offset]
    );
    res.json({ atividades: rows, pagina, porPagina });
  } catch (err) { next(err); }
}

module.exports = { dashboard, atividades };
