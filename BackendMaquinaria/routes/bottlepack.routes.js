const express = require('express')
const router = express.Router()
const bottlepackController = require('../controllers/bottlepack.controller')

router.post('/:modelo', bottlepackController.crearRegistro)
router.get('/:modelo', bottlepackController.obtenerRegistros)

module.exports = router