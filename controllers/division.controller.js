// controllers/divisionPlasticos.controller.js

const supabase = require('../config/supabaseClient')

// 1. Lista de columnas válidas según tu estructura de tabla
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

// 2. Filtro universal para limpiar los datos antes de guardar
function filtrarCamposValidos(obj) {
  let nuevo = {}
  for (let key of columnasValidas) {
    if (obj.hasOwnProperty(key)) {
      nuevo[key] = obj[key]
    }
  }
  return nuevo
}

// 3. Utilidad para convertir camelCase a snake_case
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

// 4. Cálculos automáticos
function calcularCamposAutomaticos(data) {
  const cantidadEnvasada = parseFloat(data.cantidadEnvasada) || 0
  const cantidadProgramada = parseFloat(data.cantidadProgramadaDiaria) || 0
  const horasTrabajadas = parseFloat((data.horasTrabajadas || "0").replace(':', '.')) || 0
  const totalHorasRetrasadas = parseFloat((data.totalHorasRetrasadas || "0").replace(':', '.')) || 0
  const cantidadIdealPorHora = parseFloat(data.cantidadIdealPorHora) || 0

  // Eficacia = (Cantidad Envasada / Cantidad Programada Diaria) * 100
  let eficacia = 0
  if (cantidadProgramada > 0) {
    eficacia = (cantidadEnvasada / cantidadProgramada) * 100
  }

  // Horas reales = horas trabajadas - total horas retrasadas
  let horasReales = horasTrabajadas - totalHorasRetrasadas

  // Eficiencia = (Cantidad Envasada / (Cantidad Ideal Por Hora * Horas Reales)) * 100
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

// POST /api/division/:modelo
exports.crearRegistro = async (req, res) => {
  const { modelo } = req.params
  let data = req.body
  try {
    // 1. Cálculos automáticos
    data = calcularCamposAutomaticos(data)
    // 2. Convertir a snake_case
    const dataSnake = toSnakeCase(data)
    // 3. Filtrar solo campos válidos
    const dataFinal = filtrarCamposValidos(dataSnake)
    // 4. Insertar en tabla correspondiente
    const tabla = `division_${modelo}`
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

// GET /api/division/:modelo
exports.obtenerRegistros = async (req, res) => {
  const { modelo } = req.params
  try {
    const { data, error } = await supabase
      .from(`division_${modelo}`)
      .select('*')
      .order('fecha_creacion', { ascending: false })
    if (error) throw error
    res.status(200).json(data)
  } catch (error) {
    console.error('Error al obtener registros:', error.message)
    res.status(500).json({ error: 'Error al obtener registros' })
  }
}
