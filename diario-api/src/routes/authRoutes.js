const { Router } = require('express');
const autenticar = require('../middlewares/autenticar');
const controller = require('../controllers/authController');

const router = Router();

router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', autenticar, controller.logout);
router.get('/me', autenticar, controller.me);

module.exports = router;
