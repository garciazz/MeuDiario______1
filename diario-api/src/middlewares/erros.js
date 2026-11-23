const AppError = require('../utils/AppError');

function naoEncontrado(req, res) {
  res.status(404).json({ erro: { mensagem: 'Rota não encontrada.' } });
}

function responder(res, status, mensagem, detalhes, codigo) {
  const erro = { mensagem };
  if (codigo) erro.codigo = codigo;
  if (detalhes) erro.detalhes = detalhes;
  return res.status(status).json({ erro });
}

// Precisa ter 4 parâmetros para o Express reconhecê-lo como tratador de erros.
// eslint-disable-next-line no-unused-vars
function tratadorDeErros(err, req, res, next) {
  if (err instanceof AppError) return responder(res, err.status, err.message, err.detalhes, err.codigo);

  if (err.type === 'entity.parse.failed') return responder(res, 400, 'JSON inválido no corpo da requisição.');
  if (err.type === 'entity.too.large') return responder(res, 413, 'Corpo da requisição grande demais.');

  // Erros do PostgreSQL
  switch (err.code) {
    case '23505':
      if (err.constraint === 'ux_usuarios_email') return responder(res, 409, 'Este e-mail já está cadastrado.');
      return responder(res, 409, 'Já existe um registro com esses dados.');
    case '23503':
      return responder(res, 400, 'Referência inválida: algum id informado (humor, área de interesse...) não existe.');
    case '22P02':
    case '22003':
    case '22007':
    case '22008':
      return responder(res, 400, 'Algum valor informado é inválido.');
    default:
      console.error(err);
      return responder(res, 500, 'Erro interno do servidor.');
  }
}

module.exports = { naoEncontrado, tratadorDeErros };
