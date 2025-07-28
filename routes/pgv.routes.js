const express = require('express');
const router = express.Router();
const pgvController = require('../controllers/pgv.controller');

router.get('/:modelo', pgvController.obtenerRegistros);
router.post('/:modelo', pgvController.crearRegistro);

module.exports = router;
