const AppError = require('./AppError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function inteiroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function lancarSeHouverErros(erros) {
  if (Object.keys(erros).length) throw new AppError(400, 'Dados inválidos.', erros);
}

// bcrypt só considera os primeiros 72 bytes da senha, por isso esse limite.
function erroDeSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (Buffer.byteLength(senha) > 72) return 'A senha deve ter no máximo 72 bytes.';
  return null;
}

function lerAreas(valor, erros) {
  if (valor === undefined) return undefined;
  if (!Array.isArray(valor)) {
    erros.areas_interesse = 'Informe uma lista de ids de áreas de interesse.';
    return undefined;
  }
  const ids = valor.map(inteiroPositivo);
  if (ids.some((id) => id === null)) {
    erros.areas_interesse = 'A lista deve conter apenas ids numéricos válidos.';
    return undefined;
  }
  return [...new Set(ids)];
}

function lerEmail(valor) {
  const email = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  return EMAIL_RE.test(email) && email.length <= 255 ? email : null;
}

function lerNome(valor) {
  const nome = typeof valor === 'string' ? valor.trim() : '';
  return nome.length >= 2 && nome.length <= 120 ? nome : null;
}

function validarCadastro(corpo) {
  const erros = {};
  const nome = lerNome(corpo.nome);
  if (!nome) erros.nome = 'Informe um nome entre 2 e 120 caracteres.';
  const email = lerEmail(corpo.email);
  if (!email) erros.email = 'Informe um e-mail válido.';
  const erroSenha = erroDeSenha(corpo.senha);
  if (erroSenha) erros.senha = erroSenha;

  let dataNascimento = null;
  if (corpo.data_nascimento !== undefined && corpo.data_nascimento !== null && corpo.data_nascimento !== '') {
    if (dataValida(corpo.data_nascimento)) dataNascimento = corpo.data_nascimento;
    else erros.data_nascimento = 'Use o formato AAAA-MM-DD.';
  }
  const areas = lerAreas(corpo.areas_interesse, erros) || [];

  lancarSeHouverErros(erros);
  return { nome, email, senha: corpo.senha, dataNascimento, areas };
}

// Atualização parcial: só valida e devolve o que foi enviado.
function validarAtualizacaoUsuario(corpo) {
  const erros = {};
  const campos = {};

  if (corpo.nome !== undefined) {
    const nome = lerNome(corpo.nome);
    if (nome) campos.nome = nome;
    else erros.nome = 'Informe um nome entre 2 e 120 caracteres.';
  }
  if (corpo.email !== undefined) {
    const email = lerEmail(corpo.email);
    if (email) campos.email = email;
    else erros.email = 'Informe um e-mail válido.';
  }
  if (corpo.data_nascimento !== undefined) {
    if (corpo.data_nascimento === null || corpo.data_nascimento === '') campos.dataNascimento = null;
    else if (dataValida(corpo.data_nascimento)) campos.dataNascimento = corpo.data_nascimento;
    else erros.data_nascimento = 'Use o formato AAAA-MM-DD.';
  }
  const areas = lerAreas(corpo.areas_interesse, erros);

  lancarSeHouverErros(erros);
  if (!Object.keys(campos).length && areas === undefined) {
    throw new AppError(400, 'Nenhum campo para atualizar.');
  }
  return { campos, areas };
}

// Permite enviar o texto pronto ("texto") ou as 3 perguntas do app, que viram um único texto.
function comporTexto(corpo) {
  const perguntas = [
    ['fez_bem', 'O que me fez bem'],
    ['fez_mal', 'O que me fez mal'],
    ['aprendeu', 'O que aprendi hoje'],
  ];
  const linhas = perguntas
    .filter(([chave]) => typeof corpo[chave] === 'string' && corpo[chave].trim())
    .map(([chave, rotulo]) => `${rotulo}: ${corpo[chave].trim()}`);
  return linhas.length ? linhas.join('\n') : undefined;
}

function validarEntrada(corpo, { parcial = false } = {}) {
  const erros = {};
  const campos = {};

  if (!parcial || corpo.humor_id !== undefined) {
    const humorId = inteiroPositivo(corpo.humor_id);
    if (humorId) campos.humorId = humorId;
    else erros.humor_id = 'Informe um humor válido (id numérico).';
  }

  const texto = corpo.texto !== undefined ? corpo.texto : comporTexto(corpo);
  if (texto !== undefined) {
    if (typeof texto === 'string' && texto.trim() && texto.length <= 10000) campos.texto = texto.trim();
    else erros.texto = 'Informe um texto de até 10000 caracteres.';
  } else if (!parcial) {
    erros.texto = 'Informe o texto da entrada (ou fez_bem, fez_mal, aprendeu).';
  }

  if (corpo.data_entrada !== undefined) {
    if (dataValida(corpo.data_entrada)) campos.dataEntrada = corpo.data_entrada;
    else erros.data_entrada = 'Use o formato AAAA-MM-DD.';
  }

  if (corpo.foto_url !== undefined) {
    if (corpo.foto_url === null || corpo.foto_url === '') campos.fotoUrl = null;
    else if (typeof corpo.foto_url === 'string' && corpo.foto_url.length <= 500) campos.fotoUrl = corpo.foto_url;
    else erros.foto_url = 'A foto deve ser um texto (URL ou caminho) de até 500 caracteres.';
  }

  lancarSeHouverErros(erros);
  if (parcial && !Object.keys(campos).length) throw new AppError(400, 'Nenhum campo para atualizar.');
  return campos;
}

function validarFiltrosEntrada(consulta) {
  const erros = {};
  const filtros = { limite: 30, offset: 0 };

  if (consulta.de !== undefined) {
    if (dataValida(consulta.de)) filtros.de = consulta.de;
    else erros.de = 'Use o formato AAAA-MM-DD.';
  }
  if (consulta.ate !== undefined) {
    if (dataValida(consulta.ate)) filtros.ate = consulta.ate;
    else erros.ate = 'Use o formato AAAA-MM-DD.';
  }
  if (consulta.humor_id !== undefined) {
    const humorId = inteiroPositivo(consulta.humor_id);
    if (humorId) filtros.humorId = humorId;
    else erros.humor_id = 'Informe um id numérico.';
  }
  if (consulta.limite !== undefined) {
    const limite = Number(consulta.limite);
    if (Number.isInteger(limite) && limite >= 1 && limite <= 100) filtros.limite = limite;
    else erros.limite = 'O limite deve ser um inteiro entre 1 e 100.';
  }
  if (consulta.offset !== undefined) {
    const offset = Number(consulta.offset);
    if (Number.isInteger(offset) && offset >= 0) filtros.offset = offset;
    else erros.offset = 'O offset deve ser um inteiro maior ou igual a 0.';
  }

  lancarSeHouverErros(erros);
  return filtros;
}

module.exports = {
  inteiroPositivo,
  erroDeSenha,
  lancarSeHouverErros,
  validarCadastro,
  validarAtualizacaoUsuario,
  validarEntrada,
  validarFiltrosEntrada,
};
