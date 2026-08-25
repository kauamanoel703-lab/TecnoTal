-- ============================================================
-- INTRANET TECNOTAL — schema v1
-- Aplicar: mysql -u root < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS intranet_tecnotal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE intranet_tecnotal;

-- ---------- CARGOS ----------
CREATE TABLE IF NOT EXISTS cargos (
  id            TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(30) NOT NULL UNIQUE,          -- ADMIN | GESTOR | USUARIO
  descricao     VARCHAR(150),
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- PERMISSOES ----------
CREATE TABLE IF NOT EXISTS permissoes (
  id     SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(80) NOT NULL UNIQUE,               -- ex: usuarios.criar
  descricao VARCHAR(150)
);

-- ---------- CARGO_PERMISSOES (N:N) ----------
CREATE TABLE IF NOT EXISTS cargo_permissoes (
  cargo_id     TINYINT UNSIGNED NOT NULL,
  permissao_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (cargo_id, permissao_id),
  FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE CASCADE,
  FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE
);

-- ---------- USUARIOS ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(120) NOT NULL,
  email          VARCHAR(160) NOT NULL UNIQUE,
  cpf            CHAR(11) NOT NULL UNIQUE,            -- só dígitos
  telefone       VARCHAR(20),
  senha_hash     VARCHAR(100) NOT NULL,               -- bcrypt $2b$12$
  cargo_id       TINYINT UNSIGNED NOT NULL,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

-- ---------- STATUS SOLICITACOES ----------
CREATE TABLE IF NOT EXISTS status_solicitacoes (
  id   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(20) NOT NULL UNIQUE                  -- PENDENTE | APROVADA | REJEITADA
);

-- ---------- SOLICITACOES ----------
CREATE TABLE IF NOT EXISTS solicitacoes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL,
  titulo          VARCHAR(150) NOT NULL,
  descricao       TEXT,
  status_id       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  aprovador_id    INT UNSIGNED NULL,
  resposta        TEXT NULL,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decidido_em     DATETIME NULL,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id),
  FOREIGN KEY (status_id)    REFERENCES status_solicitacoes(id),
  FOREIGN KEY (aprovador_id) REFERENCES usuarios(id)
);

-- ---------- ATIVIDADES (AUDITORIA) ----------
CREATE TABLE IF NOT EXISTS atividades (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  acao       VARCHAR(60) NOT NULL,                   -- LOGIN, LOGIN_FALHOU, UPDATE_USER...
  detalhes   VARCHAR(255),
  ip         VARCHAR(45),
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------- CONFIGURACOES ----------
CREATE TABLE IF NOT EXISTS configuracoes (
  chave   VARCHAR(80) PRIMARY KEY,
  valor   TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- NOTIFICACOES ----------
CREATE TABLE IF NOT EXISTS notificacoes (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  titulo     VARCHAR(150) NOT NULL,
  mensagem   TEXT,
  lida       BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------- ÍNDICES DE APOIO ----------
CREATE INDEX idx_usuarios_cargo   ON usuarios(cargo_id);
CREATE INDEX idx_solic_usuario    ON solicitacoes(usuario_id);
CREATE INDEX idx_solic_status     ON solicitacoes(status_id);
CREATE INDEX idx_ativ_user_data   ON atividades(usuario_id, criado_em);
