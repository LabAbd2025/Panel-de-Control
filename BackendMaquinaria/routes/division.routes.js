const express = require('express')
const router = express.Router()
const controller = require('../controllers/division.controller')

router.post('/:modelo', controller.crearRegistro)
router.get('/:modelo', controller.obtenerRegistros)

module.exports = router
