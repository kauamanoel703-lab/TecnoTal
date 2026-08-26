-- ============================================================
-- Migration 007: documentos da empresa + inventário de TI
-- ============================================================
USE intranet_tecnotal;

-- ---------- DOCUMENTOS (gerenciados pelo Administrativo) ----------
CREATE TABLE IF NOT EXISTS documentos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo         VARCHAR(200) NOT NULL,
  categoria      VARCHAR(60) NOT NULL,          -- Contrato, Política, Edital, Ata, Outro
  nome_arquivo   VARCHAR(120) NOT NULL UNIQUE,  -- nome aleatório no disco
  nome_original  VARCHAR(200) NOT NULL,
  mime_type      VARCHAR(100) NOT NULL,
  tamanho        INT UNSIGNED NOT NULL,
  visivel_para   ENUM('TODOS','LIDERANCA','RH','TI') NOT NULL DEFAULT 'TODOS',
  enviado_por    INT UNSIGNED NOT NULL,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enviado_por) REFERENCES usuarios(id)
);

-- ---------- INVENTÁRIO DE TI ----------
CREATE TABLE IF NOT EXISTS ti_inventario (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo           VARCHAR(40) NOT NULL,           -- Notebook, Desktop, Monitor, Celular...
  marca_modelo   VARCHAR(120) NOT NULL,
  numero_serie   VARCHAR(80) NOT NULL UNIQUE,
  usuario_responsavel_id INT UNSIGNED NULL,      -- quem usa o equipamento
  status         ENUM('EM_USO','DISPONIVEL','MANUTENCAO','DESCARTADO') NOT NULL DEFAULT 'DISPONIVEL',
  observacao     VARCHAR(200),
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
