
export function adaptGradesResponse(response) {
  if (!Array.isArray(response?.data)) {
    return []
  }

  return response.data.flatMap((period, periodIndex) => {
    const periodName =
      period.periodo?.descripcion_periodo ??
      period.periodo?.clave_periodo ??
      'Periodo no disponible'

    return (period.materias ?? []).map((item, subjectIndex) => ({
      id: `${periodIndex}-${item.materia?.id_grupo ?? subjectIndex}`,
      subject: item.materia?.nombre_materia ?? 'Materia sin nombre',
      period: periodName,
      grades: (item.calificaiones ?? []).map((grade) => ({
        number: grade.numero_calificacion,
        value: grade.calificacion,
      })),
    }))
  })
}
