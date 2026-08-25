const requestRoutes = require('express').Router();
const fs = require('fs');
const controller = require('../controllers/requestController');
const anexos = require('../controllers/anexoController');
const authRequired = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');
const { upload, validarConteudo } = require('../middlewares/uploadMiddleware');

requestRoutes.use(authRequired);

requestRoutes.get('/minhas', controller.listarMinhas);
requestRoutes.get('/', requirePermission('solicitacoes.aprovar'), controller.listarTodas);
requestRoutes.post('/', controller.criar);
requestRoutes.post('/:id/decidir', requirePermission('solicitacoes.aprovar'), controller.decidir);

// anexos — multer com tratamento de erro próprio (rejeição de arquivo não pode derrubar a conexão)
requestRoutes.post('/:id/anexos', (req, res) => {
  upload.array('anexos', 3)(req, res, (uploadErr) => {
    if (uploadErr) {
      // apaga arquivos parciais que tenham sido salvos
      (req.files || []).forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
      const status = uploadErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ erro: uploadErr.message });
    }
    validarConteudo(req, res, (validErr) => {
      if (validErr) return res.status(400).json({ erro: validErr.message });
      anexos.enviarAnexos(req, res);
    });
  });
});
requestRoutes.get('/:id/anexos', anexos.listarAnexos);
// download fica em rota própria (sem conflito com :id)
const anexoDownload = require('express').Router();
anexoDownload.use(authRequired);
anexoDownload.get('/api/anexos/:id/download', anexos.download);
module.exports = { router: requestRoutes, anexoDownload };
