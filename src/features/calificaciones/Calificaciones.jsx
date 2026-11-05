
import { useState } from 'react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

function getGradeStyle(grade) {
  if (grade === null || grade === undefined || grade === '') {
    return 'bg-slate-100 text-slate-500'
  }

  const value = Number(grade)

  if (!Number.isFinite(value)) {
    return 'bg-slate-100 text-slate-500'
  }

  if (value >= 90) {
    return 'bg-green-100 text-green-700'
  }

  if (value >= 70) {
    return 'bg-yellow-100 text-yellow-700'
  }

  return 'bg-red-100 text-red-700'
}

export default function Calificaciones({
  grades = [],
  loading = false,
  error = '',
}) {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('todos')

  const periods = [
    ...new Set(grades.map((grade) => grade.period)),
  ]

  const filteredGrades = grades.filter((grade) => {
    const matchesSearch = grade.subject
      .toLowerCase()
      .includes(search.trim().toLowerCase())

    const matchesPeriod =
      period === 'todos' || grade.period === period

    return matchesSearch && matchesPeriod
  })

  if (loading) {
    return (
      <LoadingSpinner message="Cargando calificaciones..." />
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Calificaciones
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta tus materias y calificaciones por periodo.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Buscar calificaciones
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Buscar materia
              </label>

              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre de la materia..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="period"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Periodo académico
              </label>

              <select
                id="period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">
                  Todos los periodos
                </option>

                {periods.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Resultados académicos
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {filteredGrades.length} materias
            </span>
          </div>

          {filteredGrades.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-slate-700">
                No hay calificaciones disponibles
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {grades.length === 0
                  ? 'Los resultados aparecerán cuando se consulte la información académica.'
                  : 'No se encontraron materias con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Materia
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Periodo
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Calificaciones parciales
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.map((grade) => (
                    <tr
                      key={grade.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {grade.subject}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {grade.period}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {grade.grades.length === 0 ? (
                            <span className="text-sm text-slate-400">
                              Sin calificaciones
                            </span>
                          ) : (
                            grade.grades.map((partial, index) => (
                              <div
                                key={`${partial.number}-${index}`}
                                className="flex flex-col items-center gap-1"
                              >
                                <span className="text-xs text-slate-500">
                                  Parcial {partial.number}
                                </span>

                                <span
                                  className={`inline-flex min-w-14 justify-center rounded-lg px-3 py-1 text-sm font-semibold ${getGradeStyle(partial.value)}`}
                                >
                                  {partial.value ?? '—'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
