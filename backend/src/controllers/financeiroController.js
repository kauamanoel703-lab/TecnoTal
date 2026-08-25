// ============================================================
// Financeiro: registrar venda + métricas de lucro
// ============================================================
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');
const { notificar, notificarComPermissao } = require('./notificacaoController');

const brl2num = (v) => Math.round(Number(v) * 100) / 100;

// POST /api/business/vendas — registra venda (baixa estoque + soma metas)
async function registrarVenda(req, res, next) {
  try {
    const { produtoId, quantidade, precoUnitario, observacao } = req.body || {};
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) return res.status(400).json({ erro: 'Quantidade inválida' });

    const conn = await db.getConnection();
    let vendaId;
    try {
      await conn.beginTransaction();
      const [[prod]] = await conn.execute('SELECT id, nome, preco_custo, preco_venda, quantidade FROM produtos WHERE id = ? FOR UPDATE', [produtoId]);
      if (!prod) { await conn.rollback(); return res.status(404).json({ erro: 'Produto não encontrado' }); }
      if (qtd > prod.quantidade) {
        await conn.rollback();
        return res.status(409).json({ erro: `Estoque insuficiente (disponível: ${prod.quantidade})` });
      }

      const preco = precoUnitario !== undefined && precoUnitario !== null && precoUnitario !== ''
        ? brl2num(precoUnitario)
        : brl2num(prod.preco_venda);
      const custo = brl2num(prod.preco_custo);
      const total = brl2num(qtd * preco);
      const lucro = brl2num(qtd * (preco - custo));

      const [ins] = await conn.execute(
        `INSERT INTO vendas (produto_id, vendedor_id, quantidade, preco_unitario, custo_unitario, total, lucro)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [prod.id, req.user.id, qtd, preco, custo, total, lucro]
      );
      vendaId = ins.insertId;
      await conn.execute('UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?', [qtd, prod.id]);
      await conn.execute(
        `INSERT INTO estoque_movimentacoes (produto_id, usuario_id, tipo, quantidade, observacao)
         VALUES (?, ?, 'SAIDA', ?, ?)`,
        [prod.id, req.user.id, qtd, `Venda #${vendaId}${observacao ? ' — ' + observacao : ''}`]
      );
      await conn.commit();

      // soma automaticamente nas metas de QUANTIDADE ativas da equipe
      const [metasQtd] = await db.execute(
        `SELECT id FROM metas WHERE tipo = 'QUANTIDADE' AND concluida = 0 AND CURDATE() BETWEEN data_inicio AND data_fim`
      );
      for (const m of metasQtd) {
        await db.execute('UPDATE metas SET progresso = progresso + ? WHERE id = ?', [qtd, m.id]);
        await db.execute(
          'UPDATE metas SET concluida = 1 WHERE id = ? AND progresso >= objetivo',
          [m.id]
        );
      }
      // metas de VALOR também
      const [metasValor] = await db.execute(
        `SELECT id, progresso, objetivo FROM metas WHERE tipo = 'VALOR' AND concluida = 0 AND CURDATE() BETWEEN data_inicio AND data_fim`
      );
      for (const m of metasValor) {
        const novo = Math.round((m.progresso + total) * 100) / 100;
        await db.execute('UPDATE metas SET progresso = ?, concluida = ? WHERE id = ?', [novo, novo >= m.objetivo, m.id]);
      }

      await registrarAtividade(req.user.id, 'REGISTRAR_VENDA', `${prod.nome} x${qtd} — lucro R$ ${lucro.toFixed(2)}`, req.ip);

      // meta batida? avisa
      for (const m of [...metasQtd, ...metasValor]) {
        const [[depois]] = await db.execute('SELECT titulo, progresso, objetivo FROM metas WHERE id = ?', [m.id]);
        if (depois.progresso >= depois.objetivo) {
          notificarComPermissao('relatorios.ver', '🏆 Meta batida por venda!', `"${depois.titulo}" atingiu o objetivo`).catch(() => {});
        }
      }
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

    res.status(201).json({ ok: true, id: vendaId });
  } catch (err) { next(err); }
}

// GET /api/business/financeiro/resumo — todas as métricas da página
async function resumo(req, res, next) {
  try {
    // ---- mês atual vs anterior ----
    const [[mesAtual]] = await db.execute(
      `SELECT IFNULL(SUM(total),0) receita, IFNULL(SUM(lucro),0) lucro, COUNT(*) numVendas
         FROM vendas WHERE YEAR(criado_em) = YEAR(CURDATE()) AND MONTH(criado_em) = MONTH(CURDATE())`
    );
    const [[mesAnterior]] = await db.execute(
      `SELECT IFNULL(SUM(lucro),0) lucro, IFNULL(SUM(total),0) receita
         FROM vendas WHERE YEAR(criado_em) = YEAR(CURDATE() - INTERVAL 1 MONTH)
           AND MONTH(criado_em) = MONTH(CURDATE() - INTERVAL 1 MONTH)`
    );

    const variacaoLucro = Number(mesAnterior.lucro) > 0
      ? Math.round(((Number(mesAtual.lucro) - Number(mesAnterior.lucro)) / Number(mesAnterior.lucro)) * 1000) / 10
      : null; // null = sem base de comparação

    // ---- série diária dos últimos 30 dias (receita e lucro) ----
    const [serie] = await db.execute(
      `SELECT DATE(criado_em) dia,
              ROUND(SUM(total),2) AS receita,
              ROUND(SUM(lucro),2) AS lucro
         FROM vendas
        WHERE criado_em >= CURDATE() - INTERVAL 30 DAY
        GROUP BY DATE(criado_em) ORDER BY dia`
    );

    // ---- mais/menos vendidos (unidades, últimos 60 dias) ----
    const [ranking] = await db.execute(
      `SELECT p.nome, p.sku,
              SUM(v.quantidade) unidades,
              ROUND(SUM(v.lucro),2) AS lucroTotal
         FROM vendas v JOIN produtos p ON p.id = v.produto_id
        WHERE v.criado_em >= CURDATE() - INTERVAL 60 DAY
        GROUP BY v.produto_id ORDER BY unidades DESC`
    );
    const maisVendido = ranking[0] || null;
    const menosVendido = ranking.length ? ranking.reduce((a, b) => (b.unidades <= a.unidades ? b : a)) : null;

    // ---- pendências do mês ----
    const mesAtualStr = new Date().toLocaleDateString('sv-SE').slice(0, 7);
    const [[pendSalarios]] = await db.execute(
      `SELECT COUNT(*) total,
              IFNULL(SUM(s.valor_mensal),0) valorEstimado
         FROM usuarios u JOIN salarios s ON s.usuario_id = u.id AND s.ativo = 1
        WHERE u.ativo = 1
          AND NOT EXISTS (SELECT 1 FROM pagamentos p WHERE p.usuario_id = u.id AND p.referencia_mes = ?)`,
      [mesAtualStr]
    );
    const [[pendSolicitacoes]] = await db.execute(
      "SELECT COUNT(*) total FROM solicitacoes WHERE status_id = 1"
    );
    const [[produtosAlerta]] = await db.execute(
      'SELECT COUNT(*) total FROM produtos WHERE ativo = 1 AND quantidade <= estoque_minimo'
    );
    const [listaAlerta] = await db.execute(
      'SELECT nome, quantidade, estoque_minimo AS estoqueMinimo FROM produtos WHERE ativo = 1 AND quantidade <= estoque_minimo LIMIT 5'
    );
    const [[metasAtivas]] = await db.execute(
      'SELECT COUNT(*) total FROM metas WHERE concluida = 0 AND CURDATE() <= data_fim'
    );

    // ---- totais gerais ----
    const [[geral]] = await db.execute(
      'SELECT ROUND(SUM(total),2) receitaTotal, ROUND(SUM(lucro),2) lucroTotal, COUNT(*) vendasTotais FROM vendas'
    );

    res.json({
      mesAtual: {
        receita: Number(mesAtual.receita),
        lucro: Number(mesAtual.lucro),
        numVendas: Number(mesAtual.numVendas),
        variacaoLucroPct: variacaoLucro, // % vs mês anterior (+ sobe / - cai / null sem base)
        mesAnteriorLucro: Number(mesAnterior.lucro),
      },
      serie,
      maisVendido,
      menosVendido,
      pendencias: {
        salariosAPagar: Number(pendSalarios.total),
        salariosValorEstimado: Number(pendSalarios.valorEstimado),
        solicitacoesPendentes: Number(pendSolicitacoes.total),
        produtosEmAlerta: Number(produtosAlerta.total),
        listaProdutosAlerta: listaAlerta,
        metasAtivas: Number(metasAtivas.total),
      },
      geral: {
        receitaTotal: Number(geral.receitaTotal),
        lucroTotal: Number(geral.lucroTotal),
        vendasTotais: Number(geral.vendasTotais),
      },
    });
  } catch (err) { next(err); }
}

// GET /api/business/vendas/ultimas — últimas 20 vendas
async function ultimasVendas(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT v.id, p.nome AS produto, u.nome AS vendedor, v.quantidade,
              ROUND(v.total,2) AS total, ROUND(v.lucro,2) AS lucro,
              DATE_FORMAT(v.criado_em,'%d/%m %H:%i') AS quando
         FROM vendas v JOIN produtos p ON p.id = v.produto_id JOIN usuarios u ON u.id = v.vendedor_id
        ORDER BY v.criado_em DESC LIMIT 20`
    );
    res.json({ vendas: rows });
  } catch (err) { next(err); }
}

module.exports = { registrarVenda, resumo, ultimasVendas };
