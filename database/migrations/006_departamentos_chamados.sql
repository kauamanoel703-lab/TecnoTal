-- ============================================================
-- Migration 006: departamentos (RH/TI/Administrativo) + chamados
-- Regra: somente ADMIN e RH definem cargos de funcionários
-- ============================================================
USE intranet_tecnotal;

-- ---------- DEPARTAMENTOS ----------
CREATE TABLE IF NOT EXISTS departamentos (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE            -- RH, TI, ADMINISTRATIVO
);

INSERT INTO departamentos (nome) VALUES ('RH'), ('TI'), ('ADMINISTRATIVO')
  ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- ---------- CARGO RH ----------
INSERT INTO cargos (id, nome, descricao) VALUES (4, 'RH', 'Recursos Humanos — define cargos, gerencia pessoas')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- permissões do RH
INSERT INTO permissoes (codigo, descricao) VALUES
  ('rh.cargos_definir',      'Definir cargo dos funcionários'),
  ('chamados.rh_ver',        'Ver chamados direcionados ao RH'),
  ('chamados.ti_ver',        'Ver chamados direcionados à TI'),
  ('chamados.adm_ver',       'Ver chamados direcionados ao Administrativo'),
  ('chamados.atender',       'Atender/encerrar chamados do seu setor')
ON DUPLICATE KEY UPDATE codigo = VALUES(codigo);

DELETE FROM cargo_permissoes WHERE cargo_id = 4;
INSERT INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 4, id FROM permissoes WHERE codigo IN (
  'dashboard.ver','perfil.editar_proprio','usuarios.listar',
  'solicitacoes.criar_proprias','relatorios.ver',
  'rh.cargos_definir','chamados.rh_ver','chamados.atender'
);

-- ADMIN também pode definir cargos (já tem todas as permissões, mas garante):
INSERT IGNORE INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 1, id FROM permissoes WHERE codigo IN ('rh.cargos_definir');

-- ---------- CHAMADOS ----------
CREATE TABLE IF NOT EXISTS chamados (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  aberto_por     INT UNSIGNED NOT NULL,
  departamento   ENUM('RH','TI','ADMINISTRATIVO') NOT NULL,
  titulo         VARCHAR(150) NOT NULL,
  descricao      TEXT,
  status         ENUM('ABERTO','EM_ATENDIMENTO','RESOLVIDO') NOT NULL DEFAULT 'ABERTO',
  prioridade     ENUM('BAIXA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
  atendido_por   INT UNSIGNED NULL,
  resposta       TEXT NULL,
  criado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechado_em     DATETIME NULL,
  FOREIGN KEY (aberto_por) REFERENCES usuarios(id),
  FOREIGN KEY (atendido_por) REFERENCES usuarios(id)
);

CREATE INDEX idx_chamados_status ON chamados(departamento, status);
