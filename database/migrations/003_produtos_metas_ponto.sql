-- ============================================================
-- Migration 003: módulos de negócio — produtos, metas, ponto
-- ============================================================
USE intranet_tecnotal;

-- ---------- PRODUTOS (estoque) ----------
CREATE TABLE IF NOT EXISTS produtos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  sku            VARCHAR(40) NOT NULL UNIQUE,       -- código interno
  categoria      VARCHAR(60),
  preco_custo    DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_venda    DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade     INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 5,             -- alerta de reposição
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- movimentações de estoque (entrada/saída) — histórico completo
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT UNSIGNED NOT NULL,
  usuario_id  INT UNSIGNED NOT NULL,                  -- quem movimentou
  tipo        ENUM('ENTRADA','SAIDA','AJUSTE') NOT NULL,
  quantidade  INT NOT NULL,                           -- sempre positivo; tipo define direção
  observacao  VARCHAR(200),
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------- METAS ----------
CREATE TABLE IF NOT EXISTS metas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo       VARCHAR(150) NOT NULL,                 -- ex: "Vender 100 telhas em agosto"
  descricao    TEXT,
  tipo         ENUM('QUANTIDADE','VALOR') NOT NULL DEFAULT 'QUANTIDADE', -- unidades vendidas ou R$
  objetivo     INT NOT NULL,                          -- número alvo
  progresso    INT NOT NULL DEFAULT 0,                -- quanto já foi alcançado
  responsavel_id INT UNSIGNED NULL,                   -- NULL = meta da equipe toda
  data_inicio  DATE NOT NULL,
  data_fim     DATE NOT NULL,
  concluida    BOOLEAN NOT NULL DEFAULT FALSE,
  criado_por   INT UNSIGNED NOT NULL,
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id),
  CHECK (data_fim >= data_inicio)
);

-- ---------- PONTO DOS FUNCIONÁRIOS ----------
CREATE TABLE IF NOT EXISTS registros_ponto (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  data_dia   DATE NOT NULL,
  hora_entrada TIME NULL,
  hora_saida   TIME NULL,
  observacao VARCHAR(150),                            -- ex: "esqueceu o ponto", falta justificada
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uk_usuario_dia (usuario_id, data_dia)    -- 1 registro por usuário por dia
);

CREATE INDEX idx_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX idx_metas_periodo ON metas(data_fim);
CREATE INDEX idx_ponto_data ON registros_ponto(data_dia);
