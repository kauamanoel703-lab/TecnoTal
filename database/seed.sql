-- ============================================================
-- INTRANET TECNOTAL — seed v1
-- Aplicar: mysql -u root intranet_tecnotal < database/seed.sql
-- ============================================================
USE intranet_tecnotal;

-- Cargos
INSERT INTO cargos (id, nome, descricao) VALUES
  (1, 'ADMIN',   'Administrador do sistema'),
  (2, 'GESTOR',  'Gestor de equipe'),
  (3, 'USUARIO', 'Usuário comum')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Permissões
INSERT INTO permissoes (codigo, descricao) VALUES
  ('dashboard.ver',              'Ver dashboard/painel'),
  ('perfil.editar_proprio',      'Editar o próprio perfil'),
  ('usuarios.listar',            'Listar usuários'),
  ('usuarios.criar',             'Criar usuários'),
  ('usuarios.editar',            'Editar usuários'),
  ('usuarios.desativar',         'Ativar/desativar usuários'),
  ('solicitacoes.criar_proprias','Abrir solicitações próprias'),
  ('solicitacoes.aprovar',       'Aprovar/rejeitar solicitações'),
  ('relatorios.ver',             'Ver relatórios'),
  ('admin.configuracoes',        'Acessar configurações do sistema'),
  ('admin.cargos_permissoes',    'Gerenciar cargos e permissões')
ON DUPLICATE KEY UPDATE codigo = VALUES(codigo);

-- ADMIN: todas as permissões
INSERT INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 1, id FROM permissoes;

-- GESTOR
INSERT INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 2, id FROM permissoes WHERE codigo IN (
  'dashboard.ver','perfil.editar_proprio','usuarios.listar',
  'solicitacoes.criar_proprias','solicitacoes.aprovar','relatorios.ver');

-- USUARIO
INSERT INTO cargo_permissoes (cargo_id, permissao_id)
SELECT 3, id FROM permissoes WHERE codigo IN (
  'dashboard.ver','perfil.editar_proprio','solicitacoes.criar_proprias');

-- Status de solicitações
INSERT INTO status_solicitacoes (id, nome) VALUES
  (1,'PENDENTE'), (2,'APROVADA'), (3,'REJEITADA')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Configurações iniciais
INSERT INTO configuracoes (chave, valor) VALUES
  ('nome_sistema', 'Intranet TecnoTal'),
  ('max_tentativas_login', '5'),
  ('bloqueio_login_minutos', '15')
ON DUPLICATE KEY UPDATE chave = VALUES(chave);

-- ============================================================
-- Usuário admin inicial — SENHA PADRÃO: Admin@123 (TROCAR!)
-- Hash bcrypt gerado para "Admin@123"
-- ============================================================
INSERT INTO usuarios (nome, email, cpf, telefone, senha_hash, cargo_id) VALUES
  ('Administrador TecnoTal', 'admin@tecnotal.com.br', '00000000000', '(00) 00000-0000',
   '$2b$12$7Vo93QNjec/0NXBLJUNmhOCUt2a.6aYkOwkfxECvnFOGzx9tLFDoe', 1);

-- ATENÇÃO: trocar a senha no primeiro login. Remover este usuário antes de produção.
