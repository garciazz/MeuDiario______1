const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const controller = require('../controllers/consentimentoController');

const router = Router();

router.use(autenticar);
router.get('/atual', controller.obter);
router.post('/', controller.aceitar);

module.exports = router;
