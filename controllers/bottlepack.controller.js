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

exports.obtenerRegistros = async (req, res) => {
  const modelo = req.params.modelo
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  try {
    const { data, error, count } = await supabase
      .from(`registros_${modelo}`)
      .select('id, fecha_inicio, producto, lote, eficiencia, horas_trabajadas, fecha_creacion', { count: 'exact' })
      .order('fecha_creacion', { ascending: false })
      .range(from, to)

    if (error) throw error
    res.status(200).json({ data, total: count })
  } catch (error) {
    console.error('Error al obtener registros:', error.message)
    res.status(500).json({ error: 'Error al obtener registros' })
  }
}

// Y para obtener detalle de UN registro:
exports.obtenerDetalleRegistro = async (req, res) => {
  const { modelo, id } = req.params
  try {
    const { data, error } = await supabase
      .from(`registros_${modelo}`)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalle' })
  }
}
