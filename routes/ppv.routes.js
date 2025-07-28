const express = require('express');
const router = express.Router();
const ppvController = require('../controllers/ppv.controller');

router.get('/:modelo', ppvController.obtenerRegistros);
router.post('/:modelo', ppvController.crearRegistro);

module.exports = router;
