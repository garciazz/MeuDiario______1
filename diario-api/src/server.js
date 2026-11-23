const config = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');

async function iniciar() {
  try {
    await pool.query('SELECT 1');
  } catch (erro) {
    console.error('Não foi possível conectar ao PostgreSQL:', erro.message);
    process.exit(1);
  }

  const servidor = app.listen(config.port, () => {
    console.log(`API do diário rodando na porta ${config.port} (${config.env})`);
  });

  const encerrar = (sinal) => {
    console.log(`${sinal} recebido, encerrando...`);
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => encerrar('SIGINT'));
  process.on('SIGTERM', () => encerrar('SIGTERM'));
}

iniciar();
