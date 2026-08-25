const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { registrarAtividade } = require('./authController');

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

// CPF: 11 dígitos + validação dos dígitos verificadores
function validarCpf(cpf) {
  if (!/^\d{11}$/.test(cpf || '')) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let dv = (soma * 10) % 11 % 10;
  if (dv !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  dv = (soma * 10) % 11 % 10;
  return dv === Number(cpf[10]);
}

async function listar(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nome, u.email, u.cpf, u.telefone, u.ativo,
              u.criado_em AS criadoEm, c.nome AS cargo, c.id AS cargoId
         FROM usuarios u JOIN cargos c ON c.id = u.cargo_id
        ORDER BY u.nome`
    );
    res.json({ usuarios: rows });
  } catch (err) { next(err); }
}

async function criar(req, res, next) {
  try {
    const { nome, email, cpf, telefone, senha, cargoId } = req.body || {};
    if (!nome || !validarEmail(email)) return res.status(400).json({ erro: 'Nome e e-mail válidos são obrigatórios' });
    const cpfLimpo = String(cpf || '').replace(/\D/g, '');
    if (!validarCpf(cpfLimpo)) return res.status(400).json({ erro: 'CPF inválido' });
    if (!senha || senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/\d/.test(senha) || !/[^a-zA-Z0-9]/.test(senha)) {
      return res.status(400).json({ erro: 'Senha deve ter ao menos 8 caracteres com letra, número e caractere especial' });
    }

    const [cargos] = await db.execute('SELECT id FROM cargos WHERE id = ?', [cargoId]);
    if (!cargos[0]) return res.status(400).json({ erro: 'Cargo inválido' });

    const hash = await bcrypt.hash(senha, 12);
    try {
      const [r] = await db.execute(
        `INSERT INTO usuarios (nome, email, cpf, telefone, senha_hash, cargo_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nome.trim(), email.toLowerCase().trim(), cpfLimpo, telefone || null, hash, cargoId]
      );
      await registrarAtividade(req.user.id, 'CRIAR_USUARIO', `id=${r.insertId} ${email}`, req.ip);
      return res.status(201).json({ ok: true, id: r.insertId });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ erro: 'E-mail ou CPF já cadastrados' });
      }
      throw e;
    }
  } catch (err) { next(err); }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, telefone, cargoId, ativo, senha } = req.body || {};

    const campos = [];
    const valores = [];
    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome.trim()); }
    if (telefone !== undefined) { campos.push('telefone = ?'); valores.push(telefone); }
    if (cargoId !== undefined) { campos.push('cargo_id = ?'); valores.push(cargoId); }
    if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo ? 1 : 0); }
    if (senha) {
      if (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/\d/.test(senha) || !/[^a-zA-Z0-9]/.test(senha)) {
        return res.status(400).json({ erro: 'Senha não atende à política' });
      }
      campos.push('senha_hash = ?');
      valores.push(await bcrypt.hash(senha, 12));
    }
    if (!campos.length) return res.status(400).json({ erro: 'Nada para atualizar' });

    valores.push(id);
    await db.execute(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, valores);
    await registrarAtividade(req.user.id, 'EDITAR_USUARIO', `id=${id}`, req.ip);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

async function perfil(req, res, next) {
  // usuário edita o próprio perfil (sem cargo/ativo)
  try {
    const { nome, telefone, senhaAtual, novaSenha } = req.body || {};
    if (novaSenha) {
      const [rows] = await db.execute('SELECT senha_hash FROM usuarios WHERE id = ?', [req.user.id]);
      const ok = await bcrypt.compare(senhaAtual || '', rows[0]?.senha_hash || '');
      if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta' });
      if (novaSenha.length < 8 || !/[a-zA-Z]/.test(novaSenha) || !/\d/.test(novaSenha) || !/[^a-zA-Z0-9]/.test(novaSenha)) {
        return res.status(400).json({ erro: 'Nova senha não atende à política' });
      }
      await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?',
        [await bcrypt.hash(novaSenha, 12), req.user.id]);
    }
    if (nome !== undefined || telefone !== undefined) {
      await db.execute('UPDATE usuarios SET nome = COALESCE(?, nome), telefone = COALESCE(?, telefone) WHERE id = ?',
        [nome?.trim() || null, telefone ?? null, req.user.id]);
    }
    await registrarAtividade(req.user.id, 'EDITAR_PERFIL', null, req.ip);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { listar, criar, atualizar, perfil, validarEmail, validarCpf };
