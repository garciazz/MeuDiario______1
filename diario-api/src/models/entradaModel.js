const { query } = require('../config/db');

const SELECT_BASE = `
  SELECT e.id, e.texto, e.data_entrada, e.foto_url, e.criado_em, e.atualizado_em,
         json_build_object('id', h.id, 'nome', h.nome, 'valor', h.valor, 'icone', h.icone) AS humor
    FROM entradas e
    JOIN humores h ON h.id = e.humor_id`;

const COLUNAS_EDITAVEIS = {
  humorId: 'humor_id',
  texto: 'texto',
  dataEntrada: 'data_entrada',
  fotoUrl: 'foto_url',
};

async function criar({ usuarioId, humorId, texto, dataEntrada, fotoUrl }) {
  const { rows } = await query(
    `INSERT INTO entradas (usuario_id, humor_id, texto, data_entrada, foto_url)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5)
     RETURNING id`,
    [usuarioId, humorId, texto, dataEntrada ?? null, fotoUrl ?? null]
  );
  return rows[0].id;
}

async function listar(usuarioId, { de, ate, humorId, limite, offset }) {
  const condicoes = ['e.usuario_id = $1'];
  const params = [usuarioId];
  if (de) {
    params.push(de);
    condicoes.push(`e.data_entrada >= $${params.length}`);
  }
  if (ate) {
    params.push(ate);
    condicoes.push(`e.data_entrada <= $${params.length}`);
  }
  if (humorId) {
    params.push(humorId);
    condicoes.push(`e.humor_id = $${params.length}`);
  }
  const where = condicoes.join(' AND ');

  const contagem = await query(`SELECT COUNT(*) AS total FROM entradas e WHERE ${where}`, params);
  params.push(limite, offset);
  const { rows } = await query(
    `${SELECT_BASE}
      WHERE ${where}
      ORDER BY e.data_entrada DESC, e.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { itens: rows, total: contagem.rows[0].total };
}

// Sempre filtra pelo dono: entrada de outro usuário é tratada como inexistente.
async function buscarPorId(id, usuarioId) {
  const { rows } = await query(`${SELECT_BASE} WHERE e.id = $1 AND e.usuario_id = $2`, [id, usuarioId]);
  return rows[0] || null;
}

async function atualizar(id, usuarioId, campos) {
  const sets = [];
  const valores = [];
  for (const [chave, coluna] of Object.entries(COLUNAS_EDITAVEIS)) {
    if (campos[chave] !== undefined) {
      valores.push(campos[chave]);
      sets.push(`${coluna} = $${valores.length}`);
    }
  }
  valores.push(id, usuarioId);
  const resultado = await query(
    `UPDATE entradas SET ${sets.join(', ')}
      WHERE id = $${valores.length - 1} AND usuario_id = $${valores.length}`,
    valores
  );
  return resultado.rowCount > 0;
}

async function remover(id, usuarioId) {
  const resultado = await query('DELETE FROM entradas WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
  return resultado.rowCount > 0;
}

module.exports = { criar, listar, buscarPorId, atualizar, remover };
