const catalogoModel = require('../models/catalogoModel');

async function humores(req, res) {
  res.json({ humores: await catalogoModel.listarHumores() });
}

async function areasInteresse(req, res) {
  res.json({ areas_interesse: await catalogoModel.listarAreasInteresse() });
}

module.exports = { humores, areasInteresse };
