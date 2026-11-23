const { query } = require('../config/db');

// "db" é opcional: passe o client de uma transação para executar dentro dela.
const executor = (db) => db || { query };

async function criar({ usuarioId, tokenHash, tipo, ip, userAgent, expiraEm }, db) {
  await executor(db).query(
    `INSERT INTO sessoes (usuario_id, token_hash, tipo, ip, user_agent, expira_em)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuarioId, tokenHash, tipo, ip, userAgent, expiraEm]
  );
}

// Sessão válida = não revogada, não expirada e de um usuário ativo.
async function buscarValida(tokenHash, tipo) {
  const { rows } = await query(
    `SELECT s.usuario_id, s.expira_em
       FROM sessoes s
       JOIN usuarios u ON u.id = s.usuario_id AND u.ativo
      WHERE s.token_hash = $1 AND s.tipo = $2
        AND s.revogado_em IS NULL AND s.expira_em > NOW()`,
    [tokenHash, tipo]
  );
  return rows[0] || null;
}

// Retorna true se havia uma sessão ativa para revogar.
async function revogar({ tokenHash, usuarioId }, db) {
  const resultado = await executor(db).query(
    `UPDATE sessoes SET revogado_em = NOW()
      WHERE token_hash = $1 AND usuario_id = $2 AND revogado_em IS NULL`,
    [tokenHash, usuarioId]
  );
  return resultado.rowCount > 0;
}

async function revogarTodas(usuarioId, db) {
  await executor(db).query(
    'UPDATE sessoes SET revogado_em = NOW() WHERE usuario_id = $1 AND revogado_em IS NULL',
    [usuarioId]
  );
}

module.exports = { criar, buscarValida, revogar, revogarTodas };
