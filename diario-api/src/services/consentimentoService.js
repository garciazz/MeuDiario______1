const AppError = require('../utils/AppError');
const { VERSAO, textoDoAviso } = require('../content/termos');

// Valida o "consentimento" enviado pelo app: precisa ser um aceite explícito (aceito === true)
// da versão do Termo que está valendo. O texto gravado é sempre o do servidor, nunca o enviado pelo cliente.
function lerAceite(valor) {
  if (!valor || typeof valor !== 'object' || valor.aceito !== true) {
    throw new AppError(
      400,
      'Para continuar, é preciso autorizar o uso dos seus dados sensíveis.',
      { consentimento: 'Marque a caixa de autorização para continuar.' },
      'CONSENTIMENTO_NECESSARIO'
    );
  }
  if (valor.versao !== VERSAO) {
    throw new AppError(
      409,
      'O Termo foi atualizado. Leia a versão mais recente e autorize novamente.',
      { versao_vigente: VERSAO },
      'TERMO_DESATUALIZADO'
    );
  }
  return true;
}

function dadosDoAceite(req) {
  return {
    textoExibido: textoDoAviso(),
    ip: req.ip || null,
    userAgent: (req.get('user-agent') || '').slice(0, 500) || null,
  };
}

module.exports = { lerAceite, dadosDoAceite };
