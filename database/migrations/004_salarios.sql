-- ============================================================
-- Migration 004: salários e pagamentos
-- ============================================================
USE intranet_tecnotal;

-- salário ATUAL de cada funcionário (1:1 com usuario)
CREATE TABLE IF NOT EXISTS salarios (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL UNIQUE,
  valor_mensal DECIMAL(10,2) NOT NULL,          -- combinado base
  dia_pagamento TINYINT NOT NULL DEFAULT 5,     -- dia do mês
  ativo        BOOLEAN NOT NULL DEFAULT TRUE,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- histórico de pagamentos (nunca deletar — é registro financeiro)
CREATE TABLE IF NOT EXISTS pagamentos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  valor_pago  DECIMAL(10,2) NOT NULL,
  referencia_mes CHAR(7) NOT NULL,             -- 'YYYY-MM' — a qual mês o pagamento se refere
  data_pagamento DATE NOT NULL,
  observacao  VARCHAR(200),
  registrado_por INT UNSIGNED NOT NULL,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  UNIQUE KEY uk_usuario_mes (usuario_id, referencia_mes), -- 1 pagamento por mês por pessoa
  CHECK (valor_pago >= 0)
);

CREATE INDEX idx_pagamentos_mes ON pagamentos(referencia_mes);
