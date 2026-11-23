const { query, transacao } = require('../config/db');
const { VERSAO } = require('../content/termos');
const consentimentoModel = require('./consentimentoModel');

const PERFIL = `
  u.id, u.nome, u.email, u.data_nascimento, u.ativo, u.criado_em, u.atualizado_em,
  COALESCE((
    SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome) ORDER BY a.nome)
      FROM usuario_areas_interesse ua
      JOIN areas_interesse a ON a.id = ua.area_id
     WHERE ua.usuario_id = u.id
  ), '[]'::json) AS areas_interesse,
  (SELECT c.versao FROM consentimentos c WHERE c.usuario_id = u.id
    ORDER BY c.aceito_em DESC, c.id DESC LIMIT 1) AS consentimento_versao,
  (SELECT MAX(c.aceito_em) FROM consentimentos c WHERE c.usuario_id = u.id) AS consentimento_em`;

// Troca as colunas soltas do consentimento por um objeto único e diz se o aceite vale para a versão atual.
function comConsentimento(linha) {
  if (!linha) return null;
  const { consentimento_versao: versao, consentimento_em: aceitoEm, ...resto } = linha;
  resto.consentimento = {
    vigente: versao === VERSAO,
    versao: versao || null,
    aceito_em: aceitoEm || null,
    versao_vigente: VERSAO,
  };
  return resto;
}

// Colunas que podem ser alteradas (nomes vindos do código, nunca do cliente).
const COLUNAS_EDITAVEIS = { nome: 'nome', email: 'email', dataNascimento: 'data_nascimento' };

async function salvarAreas(client, usuarioId, areas) {
  await client.query('DELETE FROM usuario_areas_interesse WHERE usuario_id = $1', [usuarioId]);
  if (areas.length) {
    await client.query(
      'INSERT INTO usuario_areas_interesse (usuario_id, area_id) SELECT $1, UNNEST($2::smallint[])',
      [usuarioId, areas]
    );
  }
}

// consentimento (opcional): { textoExibido, ip, userAgent } — gravado na mesma transação do cadastro.
async function criar({ nome, email, senhaHash, dataNascimento, areas, consentimento }) {
  return transacao(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, data_nascimento)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome, email, senhaHash, dataNascimento]
    );
    const id = rows[0].id;
    if (areas.length) await salvarAreas(client, id, areas);
    if (consentimento) {
      await consentimentoModel.registrar({ usuarioId: id, versao: VERSAO, ...consentimento }, client);
    }
    return id;
  });
}

async function buscarPorId(id) {
  const { rows } = await query(`SELECT ${PERFIL} FROM usuarios u WHERE u.id = $1 AND u.ativo`, [id]);
  return comConsentimento(rows[0]);
}

async function buscarPorEmailComSenha(email) {
  const { rows } = await query(
    'SELECT id, nome, email, senha_hash, ativo FROM usuarios WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return rows[0] || null;
}

async function buscarSenhaHash(id) {
  const { rows } = await query('SELECT senha_hash FROM usuarios WHERE id = $1', [id]);
  return rows[0] ? rows[0].senha_hash : null;
}

// Retorna false se o usuário não existe. "areas" undefined = não mexe nas áreas.
async function atualizar(id, campos, areas) {
  return transacao(async (client) => {
    const sets = [];
    const valores = [];
    for (const [chave, coluna] of Object.entries(COLUNAS_EDITAVEIS)) {
      if (campos[chave] !== undefined) {
        valores.push(campos[chave]);
        sets.push(`${coluna} = $${valores.length}`);
      }
    }
    if (sets.length) {
      valores.push(id);
      const resultado = await client.query(
        `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${valores.length} AND ativo`,
        valores
      );
      if (!resultado.rowCount) return false;
    } else {
      const existe = await client.query('SELECT 1 FROM usuarios WHERE id = $1 AND ativo', [id]);
      if (!existe.rowCount) return false;
    }
    if (areas !== undefined) await salvarAreas(client, id, areas);
    return true;
  });
}

async function atualizarSenha(id, senhaHash) {
  await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [senhaHash, id]);
}

// Exclusão definitiva: o banco apaga em cascata sessões, entradas, tags e lembretes.
async function remover(id) {
  const resultado = await query('DELETE FROM usuarios WHERE id = $1', [id]);
  return resultado.rowCount > 0;
}

module.exports = {
  criar,
  buscarPorId,
  buscarPorEmailComSenha,
  buscarSenhaHash,
  atualizar,
  atualizarSenha,
  remover,
};
