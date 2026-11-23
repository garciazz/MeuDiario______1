const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const routes = require('./routes');
const { naoEncontrado, tratadorDeErros } = require('./middlewares/erros');

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', 1);

app.use(cors(config.corsOrigins.length ? { origin: config.corsOrigins } : {}));
app.use(express.json({ limit: '100kb' }));
// No Express 5, req.body fica undefined quando a requisição não tem corpo.
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

app.use('/api', routes);

app.use(naoEncontrado);
app.use(tratadorDeErros);

module.exports = app;
