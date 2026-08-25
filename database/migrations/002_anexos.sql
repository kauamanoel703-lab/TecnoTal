-- Migration 002: anexos das solicitações
USE intranet_tecnotal;

CREATE TABLE IF NOT EXISTS solicitacao_anexos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  solicitacao_id INT UNSIGNED NOT NULL,
  nome_original  VARCHAR(200) NOT NULL,     -- nome p/ exibir
  nome_arquivo   VARCHAR(120) NOT NULL UNIQUE, -- nome aleatório no disco
  mime_type      VARCHAR(100) NOT NULL,
  tamanho        INT UNSIGNED NOT NULL,      -- bytes
  enviado_por    INT UNSIGNED NOT NULL,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id) ON DELETE CASCADE,
  FOREIGN KEY (enviado_por) REFERENCES usuarios(id)
);
