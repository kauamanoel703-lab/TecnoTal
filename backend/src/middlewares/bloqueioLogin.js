// Bloqueio de login por CONTA (além do rate limit por IP).
// Se alguém errar a senha N vezes, a conta fica bloqueada mesmo trocando de rede.
const db = require('../database/connection');

const MAX_TENTATIVAS = Number(process.env.LOGIN_MAX_TENTATIVAS) || 5;
const BLOQUEIO_MIN = Number(process.env.LOGIN_BLOQUEIO_MINUTOS) || 15;

// em memória (dev). Em produção com múltiplas instâncias, mover pro banco/Redis.
const tentativas = new Map(); // email -> { count, bloqueadoAte }

function normalizar(email) {
  return String(email || '').toLowerCase().trim();
}

/**
 * Retorna null se liberado, ou segundos restantes de bloqueio.
 */
function verificar(email) {
  const reg = tentativas.get(normalizar(email));
  if (!reg) return null;
  if (reg.bloqueadoAte && Date.now() < reg.bloqueadoAte) {
    return Math.ceil((reg.bloqueadoAte - Date.now()) / 1000);
  }
  return null;
}

function registrarFalha(email) {
  const key = normalizar(email);
  const reg = tentativas.get(key) || { count: 0, bloqueadoAte: 0 };
  reg.count += 1;
  if (reg.count >= MAX_TENTATIVAS) {
    reg.bloqueadoAte = Date.now() + BLOQUEIO_MIN * 60 * 1000;
    reg.count = 0;
  }
  tentativas.set(key, reg);
}

function limpar(email) {
  tentativas.delete(normalizar(email));
}

module.exports = { verificar, registrarFalha, limpar, MAX_TENTATIVAS, BLOQUEIO_MIN };
