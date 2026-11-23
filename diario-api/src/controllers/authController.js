const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');
const { transacao } = require('../config/db');
const AppError = require('../utils/AppError');
const { verificar, hashar } = require('../utils/token');
const { emitirTokens } = require('../services/authService');
const usuarioModel = require('../models/usuarioModel');
const sessaoModel = require('../models/sessaoModel');

// Comparar contra um hash falso quando o e-mail não existe evita revelar (pelo tempo de resposta) quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-tempo-constante', bcryptRounds);

async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = req.body.senha;
  if (!email || typeof senha !== 'string' || !senha) {
    throw new AppError(400, 'Informe e-mail e senha.');
  }

  const usuario = await usuarioModel.buscarPorEmailComSenha(email);
  const senhaConfere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FALSO);
  if (!usuario || !senhaConfere || !usuario.ativo) {
    throw new AppError(401, 'E-mail ou senha incorretos.');
  }

  const tokens = await emitirTokens(usuario.id, req);
  const perfil = await usuarioModel.buscarPorId(usuario.id);
  res.json({ usuario: perfil, ...tokens });
}

// Troca um refresh token por um novo par de tokens. Cada refresh token só pode ser usado uma vez.
async function refresh(req, res) {
  const recebido = req.body.refreshToken;
  if (typeof recebido !== 'string' || !recebido) {
    throw new AppError(400, 'Informe o refreshToken.');
  }

  let payload;
  try {
    payload = verificar(recebido, 'refresh');
  } catch {
    throw new AppError(401, 'Refresh token inválido ou expirado. Faça login novamente.');
  }

  const usuarioId = Number(payload.sub);
  const tokens = await transacao(async (client) => {
    const revogado = await sessaoModel.revogar({ tokenHash: hashar(recebido), usuarioId }, client);
    if (!revogado) {
      throw new AppError(401, 'Refresh token já utilizado ou encerrado. Faça login novamente.');
    }
    return emitirTokens(usuarioId, req, client);
  });

  res.json(tokens);
}

// Encerra a sessão atual (e, se enviado, o refresh token correspondente).
async function logout(req, res) {
  await sessaoModel.revogar({ tokenHash: req.tokenHash, usuarioId: req.usuarioId });
  const refreshRecebido = req.body.refreshToken;
  if (typeof refreshRecebido === 'string' && refreshRecebido) {
    await sessaoModel.revogar({ tokenHash: hashar(refreshRecebido), usuarioId: req.usuarioId });
  }
  res.status(204).end();
}

async function me(req, res) {
  const usuario = await usuarioModel.buscarPorId(req.usuarioId);
  if (!usuario) throw new AppError(404, 'Usuário não encontrado.');
  res.json({ usuario });
}

module.exports = { login, refresh, logout, me };
