
import { useState } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function getGradeStyle(grade) {
  if (grade === null || grade === undefined || grade === '') {
    return 'bg-slate-100 text-slate-500'
  }

  const numericGrade = Number(grade)

  if (!Number.isFinite(numericGrade)) {
    return 'bg-blue-100 text-blue-700'
  }

  if (numericGrade >= 90) {
    return 'bg-green-100 text-green-700'
  }

  if (numericGrade >= 70) {
    return 'bg-yellow-100 text-yellow-700'
  }

  return 'bg-red-100 text-red-700'
}

export default function Kardex({
  records = [],
  progress = null,
  loading = false,
  error = '',
}) {
  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState('todos')

  const semesters = [
    ...new Set(records.map((record) => record.semestre)),
  ].sort((a, b) => a - b)

  const filteredRecords = records.filter((record) => {
    const term = search.trim().toLowerCase()

    const matchesSearch =
      record.nombre_materia.toLowerCase().includes(term) ||
      record.clave_materia.toLowerCase().includes(term)

    const matchesSemester =
      semester === 'todos' ||
      String(record.semestre) === semester

    return matchesSearch && matchesSemester
  })

  if (loading) {
    return <LoadingSpinner message="Cargando Kardex..." />
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Kardex académico
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta tu historial académico y avance curricular.
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

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Avance académico
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Porcentaje de avance reportado por el SII
              </p>
            </div>

            <span className="text-3xl font-bold text-blue-700">
              {progress === null ? '—' : `${progress}%`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Avance académico"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? 0}
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%`,
              }}
            />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Consultar materias
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="kardex-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Buscar materia o clave
              </label>

              <input
                id="kardex-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o clave de materia..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="kardex-semester"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Semestre
              </label>

              <select
                id="kardex-semester"
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos los semestres</option>

                {semesters.map((item) => (
                  <option key={item} value={String(item)}>
                    Semestre {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Historial de materias
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {filteredRecords.length} registros
            </span>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-slate-700">
                No hay registros disponibles
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {records.length === 0
                  ? 'Tu historial aparecerá cuando se consulte el SII.'
                  : 'No se encontraron materias con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Materia</th>
                    <th className="px-5 py-4">Periodo</th>
                    <th className="px-5 py-4">Semestre</th>
                    <th className="px-5 py-4">Créditos</th>
                    <th className="px-5 py-4">Evaluación</th>
                    <th className="px-5 py-4 text-center">
                      Calificación
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record, index) => (
                    <tr
                      key={`${record.clave_materia}-${record.periodo}-${index}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {record.nombre_materia}
                        </p>
                        <p className="text-xs text-slate-400">
                          {record.clave_materia}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.periodo}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.semestre}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.creditos}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.descripcion}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex min-w-12 justify-center rounded-lg px-3 py-1 font-semibold ${getGradeStyle(record.calificacion)}`}
                        >
                          {record.calificacion || '—'}
                        </span>
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
