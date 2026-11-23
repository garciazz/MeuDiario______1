const { query } = require('../config/db');

// Grava um aceite (prova: versão, texto exibido, data/hora, IP e aparelho). "db" permite usar uma transação.
async function registrar({ usuarioId, versao, textoExibido, ip, userAgent }, db = { query }) {
  const { rows } = await db.query(
    `INSERT INTO consentimentos (usuario_id, versao, texto_exibido, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, versao, aceito_em`,
    [usuarioId, versao, textoExibido, ip, userAgent]
  );
  return rows[0];
}

async function ultimo(usuarioId) {
  const { rows } = await query(
    `SELECT id, versao, aceito_em FROM consentimentos
      WHERE usuario_id = $1 ORDER BY aceito_em DESC, id DESC LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

module.exports = { registrar, ultimo };
