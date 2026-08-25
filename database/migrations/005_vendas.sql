-- ============================================================
-- Migration 005: vendas — base das métricas financeiras
-- ============================================================
USE intranet_tecnotal;

CREATE TABLE IF NOT EXISTS vendas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produto_id   INT UNSIGNED NOT NULL,
  vendedor_id  INT UNSIGNED NOT NULL,
  quantidade   INT UNSIGNED NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,      -- preço praticado na venda (pode ter desconto)
  custo_unitario DECIMAL(10,2) NOT NULL,      -- snapshot do custo pra calcular lucro histórico
  total        DECIMAL(12,2) NOT NULL,        -- quantidade * preco_unitario
  lucro        DECIMAL(12,2) NOT NULL,        -- quantidade * (preco - custo)
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_vendas_data ON vendas(criado_em);
