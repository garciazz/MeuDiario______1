const { gerar } = require('../utils/token');
const sessaoModel = require('../models/sessaoModel');

// Cria o par de tokens (access + refresh) e registra as duas sessões no banco.
async function emitirTokens(usuarioId, req, db) {
  const access = gerar(usuarioId, 'access');
  const refresh = gerar(usuarioId, 'refresh');
  const origem = {
    usuarioId,
    ip: req.ip || null,
    userAgent: (req.get('user-agent') || '').slice(0, 500) || null,
  };

  await sessaoModel.criar({ ...origem, tokenHash: access.hash, tipo: 'access', expiraEm: access.expiraEm }, db);
  await sessaoModel.criar({ ...origem, tokenHash: refresh.hash, tipo: 'refresh', expiraEm: refresh.expiraEm }, db);

  return {
    tipo: 'Bearer',
    accessToken: access.token,
    refreshToken: refresh.token,
    accessExpiraEm: access.expiraEm,
    refreshExpiraEm: refresh.expiraEm,
  };
}

module.exports = { emitirTokens };
