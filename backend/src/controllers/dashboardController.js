// Dashboard imersivo: um único endpoint com todas as métricas consolidadas
const db = require('../database/connection');

async function resumo(req, res, next) {
  try {
    const ehLideranca = ['ADMIN', 'GESTOR'].includes(req.user.cargo);

    // ---------- COMUM A TODOS: ponto de hoje + metas ----------
    const hoje = new Date().toLocaleDateString('sv-SE');
    const [[meuPontoHoje]] = await db.execute(
      `SELECT TIME_FORMAT(hora_entrada,'%H:%i') AS entrada, TIME_FORMAT(hora_saida,'%H:%i') AS saida
         FROM registros_ponto WHERE usuario_id = ? AND data_dia = ?`,
      [req.user.id, hoje]
    );
    const [minhasMetas] = await db.execute(
      `SELECT titulo, progresso, objetivo, tipo, data_fim AS dataFim, concluida
         FROM metas
        WHERE concluida = 0 AND CURDATE() <= data_fim
          AND (responsavel_id IS NULL OR responsavel_id = ?)
        ORDER BY data_fim LIMIT 5`,
      [req.user.id]
    );
    const [[minhasSolicPendentes]] = await db.execute(
      'SELECT COUNT(*) total FROM solicitacoes WHERE usuario_id = ? AND status_id = 1',
      [req.user.id]
    );

    if (!ehLideranca) {
      return res.json({
        papel: 'USUARIO',
        meuPonto: meuPontoHoje || null,
        minhasMetas: minhasMetas.map((m) => ({
          ...m,
          percentual: Math.min(100, Math.round((m.progresso / m.objetivo) * 100)),
        })),
        minhasSolicitacoesPendentes: Number(minhasSolicPendentes.total),
      });
    }

    // ================= LIDERANÇA (gestor/admin) =================

    // ---- financeiro: mês atual vs anterior ----
    const [[finMes]] = await db.execute(
      `SELECT IFNULL(SUM(total),0) receita, IFNULL(SUM(lucro),0) lucro, COUNT(*) vendas
         FROM vendas WHERE YEAR(criado_em)=YEAR(CURDATE()) AND MONTH(criado_em)=MONTH(CURDATE())`
    );
    const [[finAnterior]] = await db.execute(
      `SELECT IFNULL(SUM(lucro),0) lucro FROM vendas
        WHERE YEAR(criado_em)=YEAR(CURDATE()-INTERVAL 1 MONTH) AND MONTH(criado_em)=MONTH(CURDATE()-INTERVAL 1 MONTH)`
    );
    const variacao = Number(finAnterior.lucro) > 0
      ? Math.round(((Number(finMes.lucro) - Number(finAnterior.lucro)) / Number(finAnterior.lucro)) * 1000) / 10
      : null;

    // ---- série combinada 14 dias: vendas + atividade geral ----
    const [serieVendas] = await db.execute(
      `SELECT DATE(criado_em) dia, ROUND(SUM(total),2) receita, ROUND(SUM(lucro),2) lucro
         FROM vendas WHERE criado_em >= CURDATE() - INTERVAL 14 DAY
        GROUP BY DATE(criado_em) ORDER BY dia`
    );

    // ---- estoque ----
    const [[estoque]] = await db.execute(
      `SELECT COUNT(*) produtos,
              IFNULL(SUM(quantidade * preco_custo),0) valorTotal,
              SUM(quantidade <= estoque_minimo) emAlerta
         FROM produtos WHERE ativo = 1`
    );
    const [topAlerta] = await db.execute(
      `SELECT nome, quantidade, estoque_minimo AS minimo FROM produtos
        WHERE ativo = 1 AND quantidade <= estoque_minimo ORDER BY quantidade LIMIT 4`
    );

    // ---- ranking produtos (30d) ----
    const [ranking] = await db.execute(
      `SELECT p.nome, SUM(v.quantidade) unidades, ROUND(SUM(v.lucro),2) AS lucro
         FROM vendas v JOIN produtos p ON p.id = v.produto_id
        WHERE v.criado_em >= CURDATE() - INTERVAL 30 DAY
        GROUP BY v.produto_id ORDER BY unidades DESC LIMIT 5`
    );

    // ---- equipe: ponto de hoje + salários pendentes ----
    const [equipePonto] = await db.execute(
      `SELECT u.nome, c.nome AS cargo,
              TIME_FORMAT(p.hora_entrada,'%H:%i') AS entrada,
              TIME_FORMAT(p.hora_saida,'%H:%i') AS saida
         FROM usuarios u
         JOIN cargos c ON c.id = u.cargo_id
         LEFT JOIN registros_ponto p ON p.usuario_id = u.id AND p.data_dia = ?
        WHERE u.ativo = 1 AND u.cargo_id != 1
        ORDER BY (p.hora_entrada IS NULL), u.nome`,
      [hoje]
    );
    const [[salariosPend]] = await db.execute(
      `SELECT COUNT(*) qtd, IFNULL(SUM(s.valor_mensal),0) valor
         FROM usuarios u JOIN salarios s ON s.usuario_id = u.id AND s.ativo = 1
        WHERE u.ativo = 1
          AND NOT EXISTS (SELECT 1 FROM pagamentos pg WHERE pg.usuario_id = u.id AND pg.referencia_mes = DATE_FORMAT(CURDATE(),'%Y-%m'))`
    );

    // ---- metas ativas da empresa ----
    const [metasEmpresa] = await db.execute(
      `SELECT m.titulo, m.progresso, m.objetivo, m.tipo, m.data_fim AS dataFim,
              IFNULL(u.nome,'Equipe') AS responsavel
         FROM metas m LEFT JOIN usuarios u ON u.id = m.responsavel_id
        WHERE m.concluida = 0 AND CURDATE() <= m.data_fim
        ORDER BY m.data_fim LIMIT 5`
    );

    // ---- operação ----
    const [[solicPendentes]] = await db.execute('SELECT COUNT(*) total FROM solicitacoes WHERE status_id = 1');
    const [[usuariosAtivos]] = await db.execute('SELECT COUNT(*) total FROM usuarios WHERE ativo = 1');
    const [ativRecentes] = await db.execute(
      `SELECT a.acao, a.detalhes, a.criado_em, u.nome AS usuario
         FROM atividades a LEFT JOIN usuarios u ON u.id = a.usuario_id
        ORDER BY a.criado_em DESC LIMIT 8`
    );

    res.json({
      papel: 'LIDERANCA',
      financeiro: {
        receitaMes: Number(finMes.receita),
        lucroMes: Number(finMes.lucro),
        vendasMes: Number(finMes.vendas),
        variacaoLucroPct: variacao,
        serieVendas,
      },
      estoque: {
        produtos: Number(estoque.produtos),
        valorTotal: Number(estoque.valorTotal),
        emAlerta: Number(estoque.emAlerta || 0),
        topAlerta,
      },
      rankingProdutos: ranking.map((r2) => ({ ...r2, unidades: Number(r2.unidades) })),
      equipe: {
        pontoHoje: equipePonto,
        presentes: equipePonto.filter((e) => e.entrada).length,
        salariosPendentes: Number(salariosPend.qtd),
        salariosValor: Number(salariosPend.valor),
      },
      metasEmpresa: metasEmpresa.map((m) => ({
        ...m,
        percentual: Math.min(100, Math.round((Number(m.progresso) / m.objetivo) * 100)),
      })),
      operacao: {
        solicitacoesPendentes: Number(solicPendentes.total),
        usuariosAtivos: Number(usuariosAtivos.total),
      },
      ativRecentes,
      // pessoal do próprio gestor/admin
      meuPonto: meuPontoHoje || null,
      minhasMetas: minhasMetas.map((m) => ({
        ...m,
        percentual: Math.min(100, Math.round((Number(m.progresso) / m.objetivo) * 100)),
      })),
    });
  } catch (err) { next(err); }
}

module.exports = { resumo };
