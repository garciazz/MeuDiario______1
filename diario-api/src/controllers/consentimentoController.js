const AppError = require('../utils/AppError');
const content = require('../content/termos');
const { lerAceite, dadosDoAceite } = require('../services/consentimentoService');
const consentimentoModel = require('../models/consentimentoModel');

// GET /termos/atual (público): aviso, Termo e Política na versão vigente.
function termoAtual(req, res) {
  res.json({
    versao: content.VERSAO,
    vigente_desde: content.VIGENTE_DESDE,
    texto_aceite: content.TEXTO_ACEITE,
    aviso: content.aviso,
    termo: content.termo,
    politica: content.politica,
  });
}

function situacao(ultimo) {
  return {
    vigente: !!ultimo && ultimo.versao === content.VERSAO,
    versao: ultimo ? ultimo.versao : null,
    aceito_em: ultimo ? ultimo.aceito_em : null,
    versao_vigente: content.VERSAO,
  };
}

// GET /consentimentos/atual: situação do aceite do usuário logado.
async function obter(req, res) {
  res.json({ consentimento: situacao(await consentimentoModel.ultimo(req.usuarioId)) });
}

// POST /consentimentos  { versao, aceito: true }
async function aceitar(req, res) {
  lerAceite(req.body);
  const registro = await consentimentoModel.registrar({ usuarioId: req.usuarioId, versao: content.VERSAO, ...dadosDoAceite(req) });
  if (!registro) throw new AppError(500, 'Não foi possível registrar o aceite.');
  res.status(201).json({ consentimento: situacao(registro) });
}

module.exports = { termoAtual, obter, aceitar };
