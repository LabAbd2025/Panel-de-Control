const supabase = require('../config/supabaseClient')

// Función para convertir claves camelCase a snake_case
const toSnakeCase = obj => {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    acc[snakeKey] = typeof value === 'object' && value !== null
      ? toSnakeCase(value)
      : value
    return acc
  }, {})
}

exports.crearRegistro = async (req, res) => {
  const { modelo } = req.params
  const data = req.body

  try {
    const tabla = `registros_${modelo}`
    const dataSnake = toSnakeCase(data)

    const { error } = await supabase.from(tabla).insert([dataSnake])

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al guardar en Supabase' })
    }

    return res.status(201).json({ message: 'Registro creado exitosamente' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// controllers/bottlepack.controller.js
exports.obtenerRegistros = async (req, res) => {
  const modelo = req.params.modelo
  try {
    const { data, error } = await supabase
      .from(`registros_${modelo}`)
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) throw error
    res.status(200).json(data)
  } catch (error) {
    console.error('Error al obtener registros:', error.message)
    res.status(500).json({ error: 'Error al obtener registros' })
  }
}
  