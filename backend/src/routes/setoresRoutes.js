const express = require('express');
const ctrl = require('../controllers/setoresController');
const authRequired = require('../middlewares/authMiddleware');
const { upload, validarConteudo } = require('../middlewares/uploadMiddleware');
const fs = require('fs');

const r = express.Router();
r.use(authRequired);

// quem pode enviar documentos: admin/gestor/RH/ADM (quem aprova + adm_ver)
function podeEnviarDocs(req, res, next) {
  const perms = req.user.permissoes || [];
  if (['ADMIN', 'GESTOR'].includes(req.user.cargo) ||
      perms.includes('chamados.adm_ver') || perms.includes('chamados.rh_ver')) return next();
  return res.status(403).json({ erro: 'Sem permissão para gerenciar documentos' });
}

// ---------- DOCUMENTOS ----------
r.post('/docs', podeEnviarDocs, (req, res) => {
  upload.array('arquivos', 5)(req, res, (err) => {
    if (err) {
      (req.files || []).forEach((f) => { try { fs.unlinkSync(f.path); } catch {} });
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ erro: err.message });
    }
    ctrl.docsEnviar(req, res);
  });
});
r.get('/docs', ctrl.docsListar);
r.get('/docs/:id/download', ctrl.docsDownload);
r.delete('/docs/:id', podeEnviarDocs, ctrl.docsExcluir);

// ---------- T.I. ----------
function soTI(req, res, next) {
  if (['ADMIN'].includes(req.user.cargo) || (req.user.permissoes || []).includes('chamados.ti_ver')) return next();
  return res.status(403).json({ erro: 'Área exclusiva da T.I.' });
}

r.get('/ti/inventario', soTI, ctrl.listarInventario);
r.post('/ti/inventario', soTI, ctrl.criarEquipamento);
r.put('/ti/inventario/:id', soTI, ctrl.editarEquipamento);
r.get('/ti/servidores', soTI, ctrl.listarServidores);
r.post('/ti/servidores', soTI, ctrl.criarServidor);
r.patch('/ti/servidores/:id/status', soTI, ctrl.mudarStatusServidor);
r.get('/ti/saude', soTI, ctrl.saude);

module.exports = r;
