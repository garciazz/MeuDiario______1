const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const controller = require('../controllers/usuarioController');

const router = Router();

// Cadastro é público; todo o resto exige token.
router.post('/', controller.criar);

router.use(autenticar);
router.get('/:id', controller.obter);
router.put('/:id', controller.atualizar);
router.patch('/:id', controller.atualizar);
router.patch('/:id/senha', controller.trocarSenha);
router.delete('/:id', controller.remover);

module.exports = router;
