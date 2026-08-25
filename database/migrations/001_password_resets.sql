-- Migration 001: tabela de tokens de recuperação de senha
USE intranet_tecnotal;

CREATE TABLE IF NOT EXISTS password_resets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL UNIQUE,        -- sha256 do token (nunca o token puro)
  expira_em   DATETIME NOT NULL,               -- 30 minutos
  usado       BOOLEAN NOT NULL DEFAULT FALSE,  -- uso único
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
