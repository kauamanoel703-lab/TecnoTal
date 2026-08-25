// ============================================================
// Módulo de negócio: Produtos (estoque), Metas e Ponto
// ============================================================
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

// ==================== PRODUTOS ====================

async function listarProdutos(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, sku, categoria, preco_custo, preco_venda, quantidade, estoque_minimo, ativo
         FROM produtos ORDER BY nome`
    );
    // flag de alerta: estoque abaixo do mínimo
    const produtos = rows.map((p) => ({ ...p, alertaEstoque: p.quantidade <= p.estoque_minimo }));
    res.json({ produtos });
  } catch (err) { next(err); }
}

async function criarProduto(req, res, next) {
  try {
    const { nome, sku, categoria, precoCusto, precoVenda, quantidade, estoqueMinimo } = req.body || {};
    if (!nome || !sku) return res.status(400).json({ erro: 'Nome e SKU obrigatórios' });

    try {
      await db.execute(
        `INSERT INTO produtos (nome, sku, categoria, preco_custo, preco_venda, quantidade, estoque_minimo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome.trim(), sku.toUpperCase().trim(), categoria || null,
         Number(precoCusto) || 0, Number(precoVenda) || 0, Number(quantidade) || 0, Number(estoqueMinimo) || 5]
      );
      await registrarAtividade(req.user.id, 'CRIAR_PRODUTO', sku, req.ip);
      return res.status(201).json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'SKU já cadastrado' });
      throw e;
    }
  } catch (err) { next(err); }
}

async function editarProduto(req, res, next) {
  try {
    const { nome, categoria, precoCusto, precoVenda, estoqueMinimo, ativo } = req.body || {};
    const campos = [], valores = [];
    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome.trim()); }
    if (categoria !== undefined) { campos.push('categoria = ?'); valores.push(categoria); }
    if (precoCusto !== undefined) { campos.push('preco_custo = ?'); valores.push(Number(precoCusto)); }
    if (precoVenda !== undefined) { campos.push('preco_venda = ?'); valores.push(Number(precoVenda)); }
    if (estoqueMinimo !== undefined) { campos.push('estoque_minimo = ?'); valores.push(Number(estoqueMinimo)); }
    if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }
    if (!campos.length) return res.status(400).json({ erro: 'Nada para atualizar' });
    valores.push(req.params.id);
    await db.execute(`UPDATE produtos SET ${campos.join(', ')} WHERE id = ?`, valores);
    await registrarAtividade(req.user.id, 'EDITAR_PRODUTO', `id=${req.params.id}`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// POST /api/business/produtos/:id/movimentar — entrada/saída/ajuste
async function movimentarEstoque(req, res, next) {
  try {
    const { tipo, quantidade, observacao } = req.body || {};
    const qtd = Number(quantidade);
    if (!['ENTRADA', 'SAIDA', 'AJUSTE'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });
    if (!Number.isInteger(qtd) || qtd <= 0) return res.status(400).json({ erro: 'Quantidade deve ser inteiro positivo' });

    let prodNome = null;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [[prod]] = await conn.execute('SELECT id, nome, quantidade FROM produtos WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!prod) { await conn.rollback(); return res.status(404).json({ erro: 'Produto não encontrado' }); }
      prodNome = prod.nome;

      let novaQtd = prod.quantidade;
      if (tipo === 'ENTRADA') novaQtd += qtd;
      else if (tipo === 'SAIDA') {
        if (qtd > prod.quantidade) {
          await conn.rollback();
          return res.status(409).json({ erro: `Estoque insuficiente (disponível: ${prod.quantidade})` });
        }
        novaQtd -= qtd;
      } else novaQtd = qtd; // AJUSTE define o valor exato

      await conn.execute('UPDATE produtos SET quantidade = ? WHERE id = ?', [novaQtd, prod.id]);
      await conn.execute(
        `INSERT INTO estoque_movimentacoes (produto_id, usuario_id, tipo, quantidade, observacao)
         VALUES (?, ?, ?, ?, ?)`,
        [prod.id, req.user.id, tipo, qtd, observacao || null]
      );
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

    await registrarAtividade(req.user.id, `ESTOQUE_${tipo}`, `${prodNome} (${qtd})`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ==================== METAS ====================

async function listarMetas(req, res, next) {
  try {
    // gestor/admin vê todas; usuário comum vê as suas + da equipe
    const [rows] = await db.execute(
      `SELECT m.id, m.titulo, m.descricao, m.tipo, m.objetivo, m.progresso,
              m.data_inicio AS dataInicio, m.data_fim AS dataFim, m.concluida,
              IFNULL(u.nome, 'Equipe') AS responsavel, m.responsavel_id AS responsavelId
         FROM metas m LEFT JOIN usuarios u ON u.id = m.responsavel_id
        ORDER BY m.concluida, m.data_fim`
    );
    const metas = rows.map((m) => ({
      ...m,
      percentual: Math.min(100, Math.round((m.progresso / m.objetivo) * 100)),
      atrasada: !m.concluida && new Date(m.dataFim) < new Date(),
    }));
    res.json({ metas });
  } catch (err) { next(err); }
}

async function criarMeta(req, res, next) {
  try {
    const { titulo, descricao, tipo, objetivo, responsavelId, dataInicio, dataFim } = req.body || {};
    if (!titulo || !objetivo || !dataInicio || !dataFim) {
      return res.status(400).json({ erro: 'Título, objetivo e datas são obrigatórios' });
    }
    if (new Date(dataFim) < new Date(dataInicio)) {
      return res.status(400).json({ erro: 'Data final antes da inicial' });
    }
    await db.execute(
      `INSERT INTO metas (titulo, descricao, tipo, objetivo, responsavel_id, data_inicio, data_fim, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo.trim(), descricao || null, tipo === 'VALOR' ? 'VALOR' : 'QUANTIDADE',
       Number(objetivo), responsavelId || null, dataInicio, dataFim, req.user.id]
    );
    await registrarAtividade(req.user.id, 'CRIAR_META', titulo.trim(), req.ip);
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
}

// POST /api/business/metas/:id/atualizar-progresso — body: { progresso } ou { incremento: true }
async function atualizarProgresso(req, res, next) {
  try {
    const { progresso, incremento } = req.body || {};
    const [[meta]] = await db.execute('SELECT id, objetivo, progresso, titulo FROM metas WHERE id = ?', [req.params.id]);
    if (!meta) return res.status(404).json({ erro: 'Meta não encontrada' });

    let novo;
    if (incremento) novo = meta.progresso + Number(progresso || 0);
    else novo = Number(progresso ?? meta.progresso);

    if (!Number.isInteger(novo) || novo < 0) return res.status(400).json({ erro: 'Progresso inválido' });
    const concluida = novo >= meta.objetivo;

    await db.execute('UPDATE metas SET progresso = ?, concluida = ? WHERE id = ?', [novo, concluida, meta.id]);
    await registrarAtividade(req.user.id, 'ATUALIZAR_META', `${meta.titulo}: ${novo}/${meta.objetivo}`, req.ip);

    // bateu a meta? avisa o criador via notificação
    if (concluida && meta.progresso < meta.objetivo) {
      const { notificarComPermissao } = require('./notificacaoController');
      notificarComPermissao('relatorios.ver', '🏆 Meta batida!', `"${meta.titulo}" atingiu o objetivo`).catch(() => {});
    }
    res.json({ ok: true, concluida });
  } catch (err) { next(err); }
}

// ==================== PONTO ====================

// POST /api/business/ponto/bater — registra entrada ou saída do dia
async function baterPonto(req, res, next) {
  try {
    const hoje = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD no fuso local
    const agora = new Date().toTimeString().slice(0, 5); // HH:MM

    const [[existente]] = await db.execute(
      'SELECT id, hora_entrada, hora_saida FROM registros_ponto WHERE usuario_id = ? AND data_dia = ?',
      [req.user.id, hoje]
    );

    if (!existente) {
      await db.execute(
        'INSERT INTO registros_ponto (usuario_id, data_dia, hora_entrada) VALUES (?, ?, ?)',
        [req.user.id, hoje, agora]
      );
      await registrarAtividade(req.user.id, 'PONTO_ENTRADA', agora, req.ip);
      return res.json({ ok: true, tipo: 'ENTRADA', hora: agora });
    }

    if (!existente.hora_saida) {
      await db.execute('UPDATE registros_ponto SET hora_saida = ? WHERE id = ?', [agora, existente.id]);
      await registrarAtividade(req.user.id, 'PONTO_SAIDA', agora, req.ip);
      return res.json({ ok: true, tipo: 'SAIDA', hora: agora });
    }

    return res.status(409).json({ erro: 'Ponto completo para hoje (entrada e saída registradas)' });
  } catch (err) { next(err); }
}

// GET /api/business/ponto/meu — meus registros recentes
async function meuPonto(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT data_dia AS dia, TIME_FORMAT(hora_entrada,'%H:%i') AS entrada,
              TIME_FORMAT(hora_saida,'%H:%i') AS saida, observacao
         FROM registros_ponto WHERE usuario_id = ?
        ORDER BY data_dia DESC LIMIT 30`,
      [req.user.id]
    );
    res.json({ registros: rows });
  } catch (err) { next(err); }
}

// GET /api/business/ponto/equipe?data=YYYY-MM-DD — visão do gestor
async function pontoEquipe(req, res, next) {
  try {
    const dia = req.query.data || new Date().toLocaleDateString('sv-SE');
    const [rows] = await db.execute(
      `SELECT u.nome, TIME_FORMAT(p.hora_entrada,'%H:%i') AS entrada,
              TIME_FORMAT(p.hora_saida,'%H:%i') AS saida, p.observacao
         FROM usuarios u
         LEFT JOIN registros_ponto p ON p.usuario_id = u.id AND p.data_dia = ?
        WHERE u.ativo = 1 AND u.cargo_id != 1
        ORDER BY u.nome`,
      [dia]
    );
    res.json({ dia, funcionarios: rows });
  } catch (err) { next(err); }
}

module.exports = {
  listarProdutos, criarProduto, editarProduto, movimentarEstoque,
  listarMetas, criarMeta, atualizarProgresso,
  baterPonto, meuPonto, pontoEquipe,
};
