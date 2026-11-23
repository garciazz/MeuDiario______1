const AppError = require('../utils/AppError');
const { inteiroPositivo, validarEntrada, validarFiltrosEntrada } = require('../utils/validadores');
const entradaModel = require('../models/entradaModel');

function idDaEntrada(req) {
  const id = inteiroPositivo(req.params.id);
  if (!id) throw new AppError(400, 'Id de entrada inválido.');
  return id;
}

async function criar(req, res) {
  const campos = validarEntrada(req.body);
  const id = await entradaModel.criar({ usuarioId: req.usuarioId, ...campos });
  const entrada = await entradaModel.buscarPorId(id, req.usuarioId);
  res.status(201).json({ entrada });
}

async function listar(req, res) {
  const filtros = validarFiltrosEntrada(req.query);
  const { itens, total } = await entradaModel.listar(req.usuarioId, filtros);
  res.json({
    entradas: itens,
    paginacao: { total, limite: filtros.limite, offset: filtros.offset },
  });
}

async function obter(req, res) {
  const entrada = await entradaModel.buscarPorId(idDaEntrada(req), req.usuarioId);
  if (!entrada) throw new AppError(404, 'Entrada não encontrada.');
  res.json({ entrada });
}

async function atualizar(req, res) {
  const id = idDaEntrada(req);
  const campos = validarEntrada(req.body, { parcial: true });
  const atualizada = await entradaModel.atualizar(id, req.usuarioId, campos);
  if (!atualizada) throw new AppError(404, 'Entrada não encontrada.');
  res.json({ entrada: await entradaModel.buscarPorId(id, req.usuarioId) });
}

async function remover(req, res) {
  const removida = await entradaModel.remover(idDaEntrada(req), req.usuarioId);
  if (!removida) throw new AppError(404, 'Entrada não encontrada.');
  res.status(204).end();
}

module.exports = { criar, listar, obter, atualizar, remover };
