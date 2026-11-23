const AppError = require('../utils/AppError');
const { verificar, hashar } = require('../utils/token');
const sessaoModel = require('../models/sessaoModel');

// Exige "Authorization: Bearer <accessToken>" e confere a sessão no banco (logout/revogação).
async function autenticar(req, res, next) {
  const [esquema, recebido] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !recebido) {
    throw new AppError(401, 'Token de acesso não informado.');
  }

  let payload;
  try {
    payload = verificar(recebido, 'access');
  } catch {
    throw new AppError(401, 'Token inválido ou expirado.');
  }

  const tokenHash = hashar(recebido);
  const sessao = await sessaoModel.buscarValida(tokenHash, 'access');
  if (!sessao || sessao.usuario_id !== Number(payload.sub)) {
    throw new AppError(401, 'Sessão encerrada ou inválida. Faça login novamente.');
  }

  req.usuarioId = sessao.usuario_id;
  req.tokenHash = tokenHash;
  next();
}

module.exports = autenticar;
