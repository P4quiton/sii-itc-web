
import { useState } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { DAYS } from '../utils/scheduleAdapter'

export default function Horario({
  classes = [],
  loading = false,
  error = '',
}) {
  const [selectedDay, setSelectedDay] = useState('todos')

  const filteredClasses = classes
    .filter((item) =>
      selectedDay === 'todos' || item.dayKey === selectedDay
    )
    .sort((a, b) => {
      const dayA = DAYS.findIndex((day) => day.key === a.dayKey)
      const dayB = DAYS.findIndex((day) => day.key === b.dayKey)

      if (dayA !== dayB) return dayA - dayB

      return a.start.localeCompare(b.start)
    })

  if (loading) {
    return <LoadingSpinner message="Cargando horario..." />
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Horario académico
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta tus clases organizadas por día y hora.
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
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Consultar horario
          </h2>

          <div className="max-w-sm">
            <label
              htmlFor="schedule-day"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Día de la semana
            </label>

            <select
              id="schedule-day"
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="todos">Todos los días</option>

              {DAYS.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Clases programadas
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {filteredClasses.length} sesiones
            </span>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-medium text-slate-700">
                No hay clases disponibles
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {classes.length === 0
                  ? 'Tu horario aparecerá cuando se consulte el SII.'
                  : 'No tienes clases registradas para el día seleccionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {DAYS.filter((day) =>
                filteredClasses.some((item) => item.dayKey === day.key)
              ).map((day) => (
                <div key={day.key}>
                  <h3 className="mb-3 border-b border-slate-200 pb-2 text-lg font-semibold text-slate-800">
                    {day.label}
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredClasses
                      .filter((item) => item.dayKey === day.key)
                      .map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                              {item.start} - {item.end}
                            </span>

                            <span className="text-xs text-slate-500">
                              Salón: {item.classroom}
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-900">
                            {item.subject}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.subjectCode}
                          </p>

                          <p className="mt-3 text-xs text-slate-400">
                            Grupo {item.group || 'Sin asignar'} · {item.period}
                          </p>
                        </article>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
