-- ============================================================
-- Migration 008: servidores da T.I. + nível de cargo nos salários
-- ============================================================
USE intranet_tecnotal;

-- ---------- SERVIDORES (gerenciados pela T.I.) ----------
CREATE TABLE IF NOT EXISTS ti_servidores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(80) NOT NULL UNIQUE,     -- ex: srv-arquivo-01
  funcao        VARCHAR(80) NOT NULL,            -- Arquivos, Banco de Dados, Intranet...
  ip            VARCHAR(45),
  sistema       VARCHAR(60),                     -- Ubuntu 22.04, Windows Server...
  status        ENUM('ONLINE','OFFLINE','MANUTENCAO') NOT NULL DEFAULT 'ONLINE',
  observacao    VARCHAR(200),
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- NÍVEL DE CARGO nos salários (seção de pagamentos) ----------
ALTER TABLE salarios
  ADD COLUMN IF NOT EXISTS nivel ENUM('JUNIOR','PLENO','SENIOR','COORDENACAO') NOT NULL DEFAULT 'PLENO' AFTER valor_mensal,
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(40) NULL AFTER nivel; -- RH, TI, ADMINISTRATIVO, VENDAS...

ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS referencia_departamento VARCHAR(40) NULL AFTER referencia_mes;
