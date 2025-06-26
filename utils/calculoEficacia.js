// Devuelve minutos entre dos horas en formato 24h ("HH:mm" o "HH:mm:ss")
function minutosEntreHoras(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0;
  // Soporta "HH:mm" y "HH:mm:ss"
  const parse = (h) => {
    const [h1, m1 = "0", s1 = "0"] = h.split(":");
    return { h: Number(h1), m: Number(m1), s: Number(s1) };
  };
  const t1 = parse(horaInicio), t2 = parse(horaFin);
  const date1 = new Date(1970, 0, 1, t1.h, t1.m, t1.s);
  const date2 = new Date(1970, 0, 1, t2.h, t2.m, t2.s);
  let diff = (date2 - date1) / 60000; // minutos
  // Si el turno cruza medianoche
  if (diff < 0) diff += 24 * 60;
  return diff;
}

// Calcula horas trabajadas reales
function calcularHorasTrabajadas(horaTurnoInicio, horaTurnoFin, eventos = []) {
  let minutosTurno = minutosEntreHoras(horaTurnoInicio, horaTurnoFin);
  let minutosEventos = 0;
  if (Array.isArray(eventos)) {
    for (const ev of eventos) {
      if (ev.hora_inicio && ev.hora_fin) {
        minutosEventos += minutosEntreHoras(ev.hora_inicio, ev.hora_fin);
      }
    }
  }
  const horasTrabajadas = (minutosTurno - minutosEventos) / 60;
  return Math.max(0, Number(horasTrabajadas.toFixed(2)));
}

// Calcula horas de retraso (eventos tipo 'parada', 'ajuste', 'retraso', etc.)
function calcularHorasRetraso(eventos = [], tiposRetraso = ['Parada', 'Retraso', 'Ajuste']) {
  let minutosRetraso = 0;
  if (Array.isArray(eventos)) {
    for (const ev of eventos) {
      if (
        ev.hora_inicio &&
        ev.hora_fin &&
        ev.tipo_evento &&
        tiposRetraso.some(
          t => ev.tipo_evento.toLowerCase().includes(t.toLowerCase())
        )
      ) {
        minutosRetraso += minutosEntreHoras(ev.hora_inicio, ev.hora_fin);
      }
    }
  }
  return Number((minutosRetraso / 60).toFixed(2));
}

// Eficiencia general por área
function calcularEficiencia({ area_id, cantidad_producida, horas_teoricas, produccion_teorica_xhora }) {
  // Si no llega el dato, determina por área
  if (!produccion_teorica_xhora) {
    produccion_teorica_xhora = getProduccionTeoricaPorHora(area_id);
  }
  const prod = Number(cantidad_producida) || 0;
  const horas = Number(horas_teoricas) || 0;
  const prod_teorica = horas * produccion_teorica_xhora;
  if (prod_teorica === 0) return 0;
  return Number(((prod / prod_teorica) * 100).toFixed(2));
}

// Obtiene producción teórica por hora según área
function getProduccionTeoricaPorHora(area_id) {
  switch (area_id) {
    case 1: return 800;     // Bottlepack
    case 2: return 1000;    // División de Plásticos
    case 3: return 900;     // PGV
    case 4: return 950;     // PPV
    case 5: return 850;     // HEM
    case 6: return 1200;    // Empaque PGV-PPV
    default: return 800;
  }
}

// Suma las horas de un array de factores/retrasos [{tipo, horas}]
function sumarHorasRetrasos(factores = []) {
  if (!Array.isArray(factores)) return 0;
  return factores.reduce((acc, f) => acc + Number(f.horas || 0), 0);
}

module.exports = {
  minutosEntreHoras,
  calcularHorasTrabajadas,
  calcularHorasRetraso,
  calcularEficiencia,
  getProduccionTeoricaPorHora,
  sumarHorasRetrasos,
};
