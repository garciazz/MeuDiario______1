const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: cfg } = require('../config/env');

const SEGREDOS = { access: cfg.accessSecret, refresh: cfg.refreshSecret };
const VALIDADE = { access: cfg.accessTtl, refresh: cfg.refreshTtl };

// No banco guardamos apenas o SHA-256 do token, nunca o token em si.
function hashar(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// tipo: 'access' ou 'refresh'. O jti garante que dois tokens emitidos no mesmo segundo sejam diferentes.
function gerar(usuarioId, tipo) {
  const token = jwt.sign({ tipo }, SEGREDOS[tipo], {
    subject: String(usuarioId),
    expiresIn: VALIDADE[tipo],
    jwtid: crypto.randomUUID(),
    algorithm: 'HS256',
  });
  const { exp } = jwt.decode(token);
  return { token, hash: hashar(token), expiraEm: new Date(exp * 1000) };
}

// Lança erro se a assinatura, a validade ou o tipo do token estiverem errados.
function verificar(token, tipo) {
  const payload = jwt.verify(token, SEGREDOS[tipo], { algorithms: ['HS256'] });
  if (payload.tipo !== tipo) throw new Error('Tipo de token incorreto.');
  return payload;
}

module.exports = { gerar, verificar, hashar };
