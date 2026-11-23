const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');
const AppError = require('../utils/AppError');
const {
  inteiroPositivo,
  erroDeSenha,
  lancarSeHouverErros,
  validarCadastro,
  validarAtualizacaoUsuario,
} = require('../utils/validadores');
const { emitirTokens } = require('../services/authService');
const { lerAceite, dadosDoAceite } = require('../services/consentimentoService');
const consentimentoModel = require('../models/consentimentoModel');
const { VERSAO } = require('../content/termos');
const usuarioModel = require('../models/usuarioModel');
const sessaoModel = require('../models/sessaoModel');

// Cada usuário só acessa o próprio cadastro. "me" é um atalho para o usuário logado.
function idDoDono(req) {
  if (req.params.id === 'me') return req.usuarioId;
  const id = inteiroPositivo(req.params.id);
  if (!id) throw new AppError(400, 'Id de usuário inválido.');
  if (id !== req.usuarioId) throw new AppError(403, 'Você só pode acessar os seus próprios dados.');
  return id;
}

// POST /usuarios (público): cria a conta e já devolve os tokens da sessão.
async function criar(req, res) {
  const dados = validarCadastro(req.body);

  // As áreas de interesse são dados sensíveis: só com o aceite do Termo, que é gravado junto com a conta.
  const enviouAceite = req.body.consentimento !== undefined && req.body.consentimento !== null;
  if (dados.areas.length && !enviouAceite) {
    throw new AppError(
      400,
      'Para guardar as áreas de interesse, é preciso autorizar o uso dos seus dados sensíveis.',
      { consentimento: 'Marque a caixa de autorização para escolher áreas de interesse.' },
      'CONSENTIMENTO_NECESSARIO'
    );
  }
  if (enviouAceite) lerAceite(req.body.consentimento);

  const senhaHash = await bcrypt.hash(dados.senha, bcryptRounds);
  const id = await usuarioModel.criar({
    ...dados,
    senhaHash,
    consentimento: enviouAceite ? dadosDoAceite(req) : undefined,
  });
  const usuario = await usuarioModel.buscarPorId(id);
  const tokens = await emitirTokens(id, req);
  res.status(201).json({ usuario, ...tokens });
}

async function obter(req, res) {
  const usuario = await usuarioModel.buscarPorId(idDoDono(req));
  if (!usuario) throw new AppError(404, 'Usuário não encontrado.');
  res.json({ usuario });
}

async function atualizar(req, res) {
  const id = idDoDono(req);
  const { campos, areas } = validarAtualizacaoUsuario(req.body);
  if (areas && areas.length) {
    const ultimo = await consentimentoModel.ultimo(id);
    if (!ultimo || ultimo.versao !== VERSAO) {
      throw new AppError(
        403,
        'Antes de guardar áreas de interesse, é preciso autorizar o Termo de uso de dados.',
        undefined,
        'CONSENTIMENTO_NECESSARIO'
      );
    }
  }
  const atualizado = await usuarioModel.atualizar(id, campos, areas);
  if (!atualizado) throw new AppError(404, 'Usuário não encontrado.');
  res.json({ usuario: await usuarioModel.buscarPorId(id) });
}

// PATCH /usuarios/:id/senha — encerra todas as sessões e devolve tokens novos para este dispositivo.
async function trocarSenha(req, res) {
  const id = idDoDono(req);
  const { senha_atual: senhaAtual, senha_nova: senhaNova } = req.body;

  const hashAtual = await usuarioModel.buscarSenhaHash(id);
  if (!hashAtual) throw new AppError(404, 'Usuário não encontrado.');
  if (typeof senhaAtual !== 'string' || !(await bcrypt.compare(senhaAtual, hashAtual))) {
    throw new AppError(400, 'Dados inválidos.', { senha_atual: 'Senha atual incorreta.' });
  }
  const erro = erroDeSenha(senhaNova);
  lancarSeHouverErros(erro ? { senha_nova: erro } : {});

  await usuarioModel.atualizarSenha(id, await bcrypt.hash(senhaNova, bcryptRounds));
  await sessaoModel.revogarTodas(id);
  res.json(await emitirTokens(id, req));
}

// DELETE /usuarios/:id — exige a senha no corpo e apaga a conta com todos os dados.
async function remover(req, res) {
  const id = idDoDono(req);
  const hashAtual = await usuarioModel.buscarSenhaHash(id);
  if (!hashAtual) throw new AppError(404, 'Usuário não encontrado.');
  if (typeof req.body.senha !== 'string' || !(await bcrypt.compare(req.body.senha, hashAtual))) {
    throw new AppError(400, 'Dados inválidos.', { senha: 'Informe a sua senha para confirmar a exclusão.' });
  }
  await usuarioModel.remover(id);
  res.status(204).end();
}

module.exports = { criar, obter, atualizar, trocarSenha, remover };
