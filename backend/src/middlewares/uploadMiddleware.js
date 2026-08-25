// Upload de anexos — validação pesada conforme docs/seguranca.md:
// - extensão E MIME type (magic bytes) permitidos
// - tamanho máximo
// - nome aleatório no disco (nunca o nome original)
// - armazenamento FORA da pasta pública (só acessível via API autenticada)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads_privados');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_MB = Number(process.env.ANEXO_MAX_MB) || 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// MIME types aceitos por extensão
const PERMITIDOS = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
};

// magic bytes (assinatura real do arquivo — não confiar na extensão)
function mimeReal(buffer) {
  if (buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf'; // %PDF
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length > 7 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    // ZIP container: docx e xlsx são zips
    const s = buffer.slice(0, 200).toString('latin1');
    if (s.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (s.includes('xl/')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/zip';
  }
  return 'desconhecido';
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      // nome aleatório; extensão preservada pra servir com content-type certo
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, crypto.randomBytes(16).toString('hex') + ext);
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 3 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!PERMITIDOS[ext]) {
      return cb(new Error(`Extensão não permitida (${ext}). Aceitos: PDF, DOCX, XLSX, JPG, PNG`));
    }
    cb(null, true);
  },
});

// middleware pós-multer: valida o MIME REAL do arquivo salvo; apaga se fake
function validarConteudo(req, res, next) {
  if (!req.files?.length) return next();
  for (const f of req.files) {
    const ext = path.extname(f.filename).toLowerCase();
    const buffer = fs.readFileSync(f.path);
    const real = mimeReal(buffer);
    const mimesOk = PERMITIDOS[ext];
    if (!mimesOk.includes(real)) {
      fs.unlinkSync(f.path); // apaga imediatamente
      return res.status(400).json({ erro: `Arquivo "${f.originalname}" não é um ${ext} válido (conteúdo: ${real})` });
    }
    // docx/xlsx passam como application/zip no magic check genérico? já resolvido acima
  }
  next();
}

module.exports = { upload, validarConteudo, UPLOAD_DIR };
