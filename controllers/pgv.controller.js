const supabase = require('../config/supabaseClient')

const columnasValidas = [
  "fecha_inicio", "fecha_fin", "duracion_dias", "dia", "producto", "lote",
  "hora_inicio", "hora_final", "horas_trabajadas", "horas_reales",
  "cantidad_ideal_por_hora", "cantidad_programada_diaria", "cantidad_envasada",
  "cantidad_envasada_teorica", "cantidad_soplada_aprobada", "cantidad_materia_prima",
  "factores_no_eficiencia", "retrasos_produccion", "retrasos_calidad_control",
  "retrasos_mantenimiento", "retrasos_asa", "retrasos_almacen", "otros_factores",
  "total_horas_retrasadas", "horas_retraso_no_eficiencia", "eficacia", "eficiencia",
  "observaciones", "fecha_creacion"
]

function filtrarCamposValidos(obj) {
  let nuevo = {}
  for (let key of columnasValidas) {
    if (obj.hasOwnProperty(key)) {
      nuevo[key] = obj[key]
    }
  }
  return nuevo
}

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

function calcularCamposAutomaticos(data) {
  const cantidadEnvasada = parseFloat(data.cantidadEnvasada) || 0
  const cantidadProgramada = parseFloat(data.cantidadProgramadaDiaria) || 0
  const horasTrabajadas = parseFloat((data.horasTrabajadas || "0").replace(':', '.')) || 0
  const totalHorasRetrasadas = parseFloat((data.totalHorasRetrasadas || "0").replace(':', '.')) || 0
  const cantidadIdealPorHora = parseFloat(data.cantidadIdealPorHora) || 0

  let eficacia = 0
  if (cantidadProgramada > 0) {
    eficacia = (cantidadEnvasada / cantidadProgramada) * 100
  }
  let horasReales = horasTrabajadas - totalHorasRetrasadas
  let eficiencia = 0
  if (cantidadIdealPorHora > 0 && horasReales > 0) {
    eficiencia = (cantidadEnvasada / (cantidadIdealPorHora * horasReales)) * 100
  }

  return {
    ...data,
    eficacia: eficacia.toFixed(2),
    eficiencia: eficiencia.toFixed(2),
    horasReales: horasReales.toFixed(2),
  }
}

// POST /api/pgv/:modelo
exports.crearRegistro = async (req, res) => {
  const { modelo } = req.params
  let data = req.body
  try {
    data = calcularCamposAutomaticos(data)
    const dataSnake = toSnakeCase(data)
    const dataFinal = filtrarCamposValidos(dataSnake)
    const tabla = `registros_pgv_${modelo}`
    const { error } = await supabase.from(tabla).insert([dataFinal])
    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Error al guardar en Supabase', details: error.message })
    }
    return res.status(201).json({ message: 'Registro creado exitosamente' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/pgv/:modelo
exports.obtenerRegistros = async (req, res) => {
  const { modelo } = req.params
  try {
    const { data, error } = await supabase
      .from(`registros_pgv_${modelo}`)
      .select('*')
      .order('fecha_creacion', { ascending: false })
    if (error) throw error
    res.status(200).json(data)
  } catch (error) {
    console.error('Error al obtener registros:', error.message)
    res.status(500).json({ error: 'Error al obtener registros' })
  }
}
