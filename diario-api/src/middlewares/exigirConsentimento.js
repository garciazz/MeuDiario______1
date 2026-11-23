const AppError = require('../utils/AppError');
const { VERSAO } = require('../content/termos');
const consentimentoModel = require('../models/consentimentoModel');

// Barra a gravação de dados sensíveis enquanto não houver aceite da versão vigente do Termo.
async function exigirConsentimento(req, res, next) {
  const ultimo = await consentimentoModel.ultimo(req.usuarioId);
  if (!ultimo || ultimo.versao !== VERSAO) {
    throw new AppError(
      403,
      'Antes de registrar dados, é preciso ler e autorizar o Termo de uso de dados.',
      undefined,
      'CONSENTIMENTO_NECESSARIO'
    );
  }
  next();
}

module.exports = exigirConsentimento;
