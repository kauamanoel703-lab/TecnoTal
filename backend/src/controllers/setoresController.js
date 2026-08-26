// ============================================================
// Documentos (Administrativo), Inventário/Servidores (T.I.)
// ============================================================
const db = require('../database/connection');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../middlewares/uploadMiddleware');
const { registrarAtividade } = require('./authController');

// ==================== DOCUMENTOS ====================

// POST /api/docs — upload (só quem pode aprovar: admin/gestor/RH/ADM)
async function enviar(req, res, next) {
  try {
    if (!req.files?.length) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    const visivelPara = ['TODOS', 'LIDERANCA', 'RH', 'TI'].includes(req.body.visivelPara)
      ? req.body.visivelPara : 'TODOS';
    const categoria = req.body.categoria || 'Outro';

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO documentos (titulo, categoria, nome_arquivo, nome_original, mime_type, tamanho, visivel_para, enviado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.body.titulo || f.originalname.replace(/\.[^.]+$/, ''), categoria,
         f.filename, f.originalname, f.mimetype, f.size, visivelPara, req.user.id]
      );
    }
    await registrarAtividade(req.user.id, 'ENVIAR_DOCUMENTO', `${categoria}: ${req.files.map((f) => f.originalname).join(', ')}`, req.ip);
    res.status(201).json({ ok: true, anexados: req.files.length });
  } catch (err) { next(err); }
}

// GET /api/docs — lista conforme visibilidade
async function listar(req, res, next) {
  try {
    const filtroExtra = [];
    const params = [];
    if (!['ADMIN', 'GESTOR'].includes(req.user.cargo)) {
      // não-liderança só vê TODOS (+ o do próprio setor se tiver fila de chamados)
      filtroExtra.push("(visivel_para = 'TODOS')");
      if ((req.user.permissoes || []).includes('chamados.rh_ver')) filtroExtra.push("(visivel_para = 'RH')");
      if ((req.user.permissoes || []).includes('chamados.ti_ver')) filtroExtra.push("(visivel_para = 'TI')");
    }
    let sql = `SELECT d.id, d.titulo, d.categoria, d.nome_original, d.tamanho, d.visivel_para AS visivelPara,
                      DATE_FORMAT(d.criado_em,'%d/%m/%Y') AS criadoEm, u.nome AS enviadoPor
                 FROM documentos d JOIN usuarios u ON u.id = d.enviado_por`;
    if (filtroExtra.length) sql += ' WHERE (' + filtroExtra.join(' OR ') + ')';
    sql += ' ORDER BY d.criado_em DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ documentos: rows });
  } catch (err) { next(err); }
}

// GET /api/docs/:id/download
async function download(req, res, next) {
  try {
    const [[doc]] = await db.execute('SELECT * FROM documentos WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ erro: 'Documento não encontrado' });
    // mesma checagem de visibilidade
    if (!['ADMIN', 'GESTOR'].includes(req.user.cargo) && doc.visivel_para !== 'TODOS') {
      const perms = req.user.permissoes || [];
      const okVer =
        (doc.visivel_para === 'RH' && perms.includes('chamados.rh_ver')) ||
        (doc.visivel_para === 'TI' && perms.includes('chamados.ti_ver'));
      if (!okVer) return res.status(403).json({ erro: 'Sem permissão para este documento' });
    }
    const caminho = path.join(UPLOAD_DIR, doc.nome_arquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado' });
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.nome_original)}"`);
    fs.createReadStream(caminho).pipe(res);
  } catch (err) { next(err); }
}

// DELETE /api/docs/:id — só quem pode aprovar
async function excluir(req, res, next) {
  try {
    const [[doc]] = await db.execute('SELECT * FROM documentos WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ erro: 'Não encontrado' });
    const caminho = path.join(UPLOAD_DIR, doc.nome_arquivo);
    if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
    await db.execute('DELETE FROM documentos WHERE id = ?', [doc.id]);
    await registrarAtividade(req.user.id, 'EXCLUIR_DOCUMENTO', doc.titulo, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ==================== T.I.: INVENTÁRIO ====================

async function listarInventario(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT i.id, i.tipo, i.marca_modelo AS marcaModelo, i.numero_serie AS numeroSerie,
              i.status, i.observacao, IFNULL(u.nome,'—') AS responsavel,
              i.usuario_responsavel_id AS responsavelId
         FROM ti_inventario i LEFT JOIN usuarios u ON u.id = i.usuario_responsavel_id
        ORDER BY i.tipo, i.status`
    );
    res.json({ equipamentos: rows });
  } catch (err) { next(err); }
}

async function criarEquipamento(req, res, next) {
  try {
    const { tipo, marcaModelo, numeroSerie, responsavelId, status, observacao } = req.body || {};
    if (!tipo || !marcaModelo || !numeroSerie) return res.status(400).json({ erro: 'Tipo, marca/modelo e série obrigatórios' });
    try {
      await db.execute(
        `INSERT INTO ti_inventario (tipo, marca_modelo, numero_serie, usuario_responsavel_id, status, observacao)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tipo.trim(), marcaModelo.trim(), numeroSerie.toUpperCase().trim(),
         responsavelId || null, status || 'DISPONIVEL', observacao || null]
      );
      await registrarAtividade(req.user.id, 'TI_CADASTRAR_EQUIPAMENTO', numeroSerie, req.ip);
      res.status(201).json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Número de série já cadastrado' });
      throw e;
    }
  } catch (err) { next(err); }
}

async function editarEquipamento(req, res, next) {
  try {
    const { responsavelId, status, observacao, tipo, marcaModelo } = req.body || {};
    const campos = [], valores = [];
    if (responsavelId !== undefined) { campos.push('usuario_responsavel_id = ?'); valores.push(responsavelId || null); }
    if (status !== undefined) { campos.push('status = ?'); valores.push(status); }
    if (observacao !== undefined) { campos.push('observacao = ?'); valores.push(observacao); }
    if (tipo !== undefined) { campos.push('tipo = ?'); valores.push(tipo.trim()); }
    if (marcaModelo !== undefined) { campos.push('marca_modelo = ?'); valores.push(marcaModelo.trim()); }
    if (!campos.length) return res.status(400).json({ erro: 'Nada para atualizar' });
    valores.push(req.params.id);
    await db.execute(`UPDATE ti_inventario SET ${campos.join(', ')} WHERE id = ?`, valores);
    await registrarAtividade(req.user.id, 'TI_EDITAR_EQUIPAMENTO', `id=${req.params.id}`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// ==================== T.I.: SERVIDORES ====================

async function listarServidores(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT id, nome, funcao, ip, sistema, status, observacao,
              DATE_FORMAT(atualizado_em,'%d/%m %H:%i') AS atualizadoEm
         FROM ti_servidores ORDER BY nome`
    );
    res.json({ servidores: rows });
  } catch (err) { next(err); }
}

async function criarServidor(req, res, next) {
  try {
    const { nome, funcao, ip, sistema, status, observacao } = req.body || {};
    if (!nome || !funcao) return res.status(400).json({ erro: 'Nome e função obrigatórios' });
    try {
      await db.execute(
        `INSERT INTO ti_servidores (nome, funcao, ip, sistema, status, observacao)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nome.trim(), funcao.trim(), ip || null, sistema || null, status || 'ONLINE', observacao || null]
      );
      await registrarAtividade(req.user.id, 'TI_CADASTRAR_SERVIDOR', nome.trim(), req.ip);
      res.status(201).json({ ok: true });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Servidor com esse nome já existe' });
      throw e;
    }
  } catch (err) { next(err); }
}

// PATCH rápido de status (T.I. muda online/offline/manutenção)
async function mudarStatusServidor(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!['ONLINE', 'OFFLINE', 'MANUTENCAO'].includes(status)) return res.status(400).json({ erro: 'Status inválido' });
    await db.execute('UPDATE ti_servidores SET status = ? WHERE id = ?', [status, req.params.id]);
    await registrarAtividade(req.user.id, 'TI_STATUS_SERVIDOR', `id=${req.params.id} → ${status}`, req.ip);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// GET /api/ti/saude — saúde da intranet
async function saude(req, res, next) {
  try {
    // ping no banco (a própria query prova que está vivo)
    const inicio = Date.now();
    const [[dbInfo]] = await db.execute('SELECT VERSION() versao');
    const dbLatenciaMs = Date.now() - inicio;

    const [[contadores]] = await db.execute(
      `SELECT (SELECT COUNT(*) FROM usuarios WHERE ativo=1) usuarios,
              (SELECT COUNT(*) FROM chamados WHERE status != 'RESOLVIDO') chamadosAbertos,
              (SELECT COUNT(*) FROM ti_servidores WHERE status='OFFLINE') servidoresOffline,
              (SELECT COUNT(*) FROM produtos WHERE quantidade <= estoque_minimo AND ativo=1) estoqueAlerta`
    );
    const uptimeSegundos = Math.round(process.uptime());
    const memoriaMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

    res.json({
      api: { status: 'ONLINE', uptimeMinutos: Math.floor(uptimeSegundos / 60), memoriaMb },
      banco: { status: 'ONLINE', latenciaMs: dbLatenciaMs, versao: dbInfo.versao },
      contadores,
    });
  } catch (err) { next(err); }
}

module.exports = {
  docsEnviar: enviar, docsListar: listar, docsDownload: download, docsExcluir: excluir,
  listarInventario, criarEquipamento, editarEquipamento,
  listarServidores, criarServidor, mudarStatusServidor, saude,
};
