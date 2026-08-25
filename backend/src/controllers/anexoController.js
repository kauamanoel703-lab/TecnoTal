// Controller de anexos — upload, listagem e download autenticado
const db = require('../database/connection');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../middlewares/uploadMiddleware');
const { registrarAtividade } = require('./authController');

// POST /api/requests/:id/anexos (multipart, até 3 arquivos)
async function enviarAnexos(req, res, next) {
  try {
    const { id } = req.params;
    const [[sol]] = await db.execute('SELECT id, usuario_id, status_id FROM solicitacoes WHERE id = ?', [id]);
    if (!sol) return res.status(404).json({ erro: 'Solicitação não encontrada' });
    // só o dono (enquanto pendente) ou um aprovador pode anexar
    const ehDono = sol.usuario_id === req.user.id;
    const ehAprovador = req.user.permissoes?.includes('solicitacoes.aprovar') || ['GESTOR', 'ADMIN'].includes(req.user.cargo);
    if (!ehDono && !ehAprovador) return res.status(403).json({ erro: 'Sem permissão' });
    if (!req.files?.length) return res.status(400).json({ erro: 'Nenhum arquivo enviado' });

    for (const f of req.files) {
      await db.execute(
        `INSERT INTO solicitacao_anexos (solicitacao_id, nome_original, nome_arquivo, mime_type, tamanho, enviado_por)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, f.originalname.slice(0, 200), f.filename, f.mimetype, f.size, req.user.id]
      );
    }
    await registrarAtividade(req.user.id, 'ANEXAR_ARQUIVO', `solicitacao=${id} (${req.files.length})`, req.ip);
    return res.status(201).json({ ok: true, anexados: req.files.length });
  } catch (err) { next(err); }
}

// GET /api/requests/:id/anexos — lista metadados
async function listarAnexos(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT a.id, a.nome_original, a.mime_type, a.tamanho, a.criado_em, u.nome AS enviadoPor
         FROM solicitacao_anexos a JOIN usuarios u ON u.id = a.enviado_por
        WHERE a.solicitacao_id = ? ORDER BY a.criado_em`,
      [req.params.id]
    );
    res.json({ anexos: rows });
  } catch (err) { next(err); }
}

// GET /api/anexos/:id/download — stream autenticado (nunca rota estática!)
async function download(req, res, next) {
  try {
    const [[anexo]] = await db.execute('SELECT * FROM solicitacao_anexos WHERE id = ?', [req.params.id]);
    if (!anexo) return res.status(404).json({ erro: 'Anexo não encontrado' });
    const caminho = path.join(UPLOAD_DIR, anexo.nome_arquivo);
    if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Arquivo não encontrado no servidor' });
    res.setHeader('Content-Type', anexo.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(anexo.nome_original)}"`);
    fs.createReadStream(caminho).pipe(res);
  } catch (err) { next(err); }
}

module.exports = { enviarAnexos, listarAnexos, download };
