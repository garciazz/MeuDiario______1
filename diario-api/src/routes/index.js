const { Router } = require('express');
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const entradaRoutes = require('./entradaRoutes');
const consentimentoRoutes = require('./consentimentoRoutes');
const consentimento = require('../controllers/consentimentoController');
const catalogo = require('../controllers/catalogoController');

const router = Router();

router.get('/saude', (req, res) => res.json({ status: 'ok' }));

// Listas públicas usadas na tela de cadastro e no seletor de emoções.
router.get('/humores', catalogo.humores);
router.get('/areas-interesse', catalogo.areasInteresse);

// Termo de Autorização e Política de Privacidade (públicos: aparecem antes do cadastro).
router.get('/termos/atual', consentimento.termoAtual);

router.use('/auth', authRoutes);
router.use('/consentimentos', consentimentoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/entradas', entradaRoutes);

module.exports = router;
