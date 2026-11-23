const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const exigirConsentimento = require('../middlewares/exigirConsentimento');
const controller = require('../controllers/entradaController');

const router = Router();

router.use(autenticar);
// Gravar ou alterar entradas exige o aceite do Termo (ler, consultar e apagar continuam livres).
router.post('/', exigirConsentimento, controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.obter);
router.put('/:id', exigirConsentimento, controller.atualizar);
router.patch('/:id', exigirConsentimento, controller.atualizar);
router.delete('/:id', controller.remover);

module.exports = router;
