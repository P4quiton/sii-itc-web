
const DAYS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
]

function parseTimeRange(value) {
  if (typeof value !== 'string') return null

  const match = value.match(
    /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/
  )

  if (!match) return null

  return {
    start: match[1],
    end: match[2],
  }
}

export function adaptScheduleResponse(response) {
  if (!Array.isArray(response?.data)) {
    return []
  }

  return response.data.flatMap((period, periodIndex) => {
    const periodName =
      period.periodo?.descripcion_periodo ??
      period.periodo?.clave_periodo ??
      'Periodo no disponible'

    return (period.horario ?? []).flatMap((subject, subjectIndex) =>
      DAYS.flatMap((day) => {
        const time = parseTimeRange(subject[day.key])

        if (!time) return []

        return [{
          id: `${periodIndex}-${subject.id_grupo ?? subjectIndex}-${day.key}`,
          subject: subject.nombre_materia ?? 'Materia sin nombre',
          subjectCode: subject.clave_materia ?? '',
          group: subject.letra_grupo ?? '',
          period: periodName,
          day: day.label,
          dayKey: day.key,
          start: time.start,
          end: time.end,
          classroom: subject[`${day.key}_clave_salon`] ?? 'Sin asignar',
        }]
      })
    )
  })
}

export { DAYS }
