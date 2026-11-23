const { query } = require('../config/db');

async function listarHumores() {
  const { rows } = await query('SELECT id, nome, valor, icone FROM humores ORDER BY valor');
  return rows;
}

async function listarAreasInteresse() {
  const { rows } = await query('SELECT id, nome, descricao FROM areas_interesse ORDER BY nome');
  return rows;
}

module.exports = { listarHumores, listarAreasInteresse };
