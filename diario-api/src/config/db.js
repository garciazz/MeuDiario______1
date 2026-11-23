const { Pool, types } = require('pg');
const { databaseUrl, dbTimezone } = require('./env');

// BIGINT (ids, COUNT) vem do driver como string; aqui vira número.
types.setTypeParser(20, (valor) => parseInt(valor, 10));
// DATE vira 'AAAA-MM-DD' (sem conversão para Date, que causaria erro de fuso).
types.setTypeParser(1082, (valor) => valor);

// "options" define o fuso da sessão no banco; afeta CURRENT_DATE (data padrão das entradas).
const pool = new Pool({ connectionString: databaseUrl, options: `-c TimeZone=${dbTimezone}` });

pool.on('error', (erro) => {
  console.error('Erro inesperado no pool do PostgreSQL:', erro.message);
});

function query(texto, parametros) {
  return pool.query(texto, parametros);
}

// Executa várias queries na mesma transação (COMMIT ao final, ROLLBACK em erro).
async function transacao(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transacao };
