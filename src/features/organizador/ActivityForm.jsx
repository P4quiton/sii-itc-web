
import { useState } from 'react'

const initialValues = {
  title: '',
  description: '',
  subject: '',
  activity_type: 'tarea',
  due_date: '',
  priority: 'media',
  status: 'pendiente',
  estimated_minutes: '',
}

function toLocalDateTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const pad = (number) => String(number).padStart(2, '0')

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

function getInitialValues(activity) {
  if (!activity) return { ...initialValues }

  return {
    title: activity.title ?? '',
    description: activity.description ?? '',
    subject: activity.subject ?? '',
    activity_type: activity.activity_type ?? 'tarea',
    due_date: toLocalDateTime(activity.due_date),
    priority: activity.priority ?? 'media',
    status: activity.status ?? 'pendiente',
    estimated_minutes:
      activity.estimated_minutes == null
        ? ''
        : String(activity.estimated_minutes),
  }
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60'

const labelClass =
  'mb-2 block text-sm font-medium text-slate-700'

export default function ActivityForm({
  activity = null,
  subjects = [],
  subjectsLoading = false,
  subjectsError = '',
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState(() =>
    getInitialValues(activity)
  )
  const [error, setError] = useState('')

  const isEditing = Boolean(activity)

  const availableSubjects = [
    ...new Set(
      subjects
        .filter((subject) => typeof subject === 'string')
        .map((subject) => subject.trim())
        .filter(Boolean)
    ),
  ]

  const currentSubject = form.subject.trim()

  const isPreviousSubject =
    currentSubject &&
    !availableSubjects.includes(currentSubject)

  const showManualSubject =
    !subjectsLoading &&
    availableSubjects.length === 0

  function changeField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const title = form.title.trim()
    const subject = form.subject.trim()
    const description = form.description.trim()

    if (!title) {
      setError('El título de la actividad es obligatorio.')
      return
    }

    if (title.length > 200) {
      setError('El título no puede superar 200 caracteres.')
      return
    }

    if (subject.length > 200) {
      setError('La materia no puede superar 200 caracteres.')
      return
    }

    if (description.length > 5000) {
      setError('La descripción no puede superar 5000 caracteres.')
      return
    }

    if (!form.due_date) {
      setError('Selecciona la fecha y hora de entrega.')
      return
    }

    const dueDate = new Date(form.due_date)

    if (Number.isNaN(dueDate.getTime())) {
      setError('La fecha de entrega no es válida.')
      return
    }

    let estimatedMinutes = null

    if (form.estimated_minutes !== '') {
      estimatedMinutes = Number(form.estimated_minutes)

      if (
        !Number.isSafeInteger(estimatedMinutes) ||
        estimatedMinutes < 1
      ) {
        setError(
          'El tiempo estimado debe ser un número entero positivo.'
        )
        return
      }
    }

    const payload = {
      title,
      description: description || null,
      subject: subject || null,
      activity_type: form.activity_type,
      due_date: dueDate.toISOString(),
      priority: form.priority,
      status: form.status,
      estimated_minutes: estimatedMinutes,
    }

    try {
      await onSubmit(payload)
    } catch {
      setError(
        'No fue posible guardar la actividad. Revisa el mensaje de error e inténtalo nuevamente.'
      )
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {isEditing
            ? 'Editar actividad'
            : 'Nueva actividad'}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Registra los detalles necesarios para organizar
          tus entregas y analizar tu carga académica.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="activity-title"
              className={labelClass}
            >
              Título *
            </label>

            <input
              id="activity-title"
              type="text"
              maxLength={200}
              value={form.title}
              onChange={(event) =>
                changeField('title', event.target.value)
              }
              placeholder="Ej. Entregar práctica de redes"
              disabled={saving}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="activity-subject"
              className={labelClass}
            >
              Materia
            </label>

            {showManualSubject ? (
              <>
                <input
                  id="activity-subject"
                  type="text"
                  maxLength={200}
                  value={form.subject}
                  onChange={(event) =>
                    changeField('subject', event.target.value)
                  }
                  placeholder="Escribe el nombre de la materia"
                  disabled={saving}
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-500">
                  No hay materias disponibles del horario
                  institucional. Puedes escribirla manualmente.
                </p>
              </>
            ) : (
              <>
                <select
                  id="activity-subject"
                  value={form.subject}
                  onChange={(event) =>
                    changeField('subject', event.target.value)
                  }
                  disabled={saving || subjectsLoading}
                  className={inputClass}
                >
                  <option value="">
                    {subjectsLoading
                      ? 'Cargando materias...'
                      : 'Selecciona una materia'}
                  </option>

                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}

                  {isPreviousSubject && (
                    <option value={currentSubject}>
                      {currentSubject} (materia registrada)
                    </option>
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Materias obtenidas del horario institucional
                  del periodo actual.
                </p>
              </>
            )}

            {subjectsError && (
              <p
                role="status"
                className="mt-2 text-xs text-amber-700"
              >
                {subjectsError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="activity-type"
              className={labelClass}
            >
              Tipo de actividad *
            </label>

            <select
              id="activity-type"
              value={form.activity_type}
              onChange={(event) =>
                changeField('activity_type', event.target.value)
              }
              disabled={saving}
              className={inputClass}
            >
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="activity-description"
              className={labelClass}
            >
              Descripción
            </label>

            <textarea
              id="activity-description"
              rows={4}
              maxLength={5000}
              value={form.description}
              onChange={(event) =>
                changeField('description', event.target.value)
              }
              placeholder="Describe lo que necesitas realizar..."
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="activity-date"
              className={labelClass}
            >
              Fecha y hora de entrega *
            </label>

            <input
              id="activity-date"
              type="datetime-local"
              value={form.due_date}
              onChange={(event) =>
                changeField('due_date', event.target.value)
              }
              disabled={saving}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="activity-estimate"
              className={labelClass}
            >
              Tiempo estimado (minutos)
            </label>

            <input
              id="activity-estimate"
              type="number"
              min="1"
              step="1"
              value={form.estimated_minutes}
              onChange={(event) =>
                changeField(
                  'estimated_minutes',
                  event.target.value
                )
              }
              placeholder="Ej. 120"
              disabled={saving}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-500">
              Opcional. Ayuda a calcular la carga de trabajo.
            </p>
          </div>

          <div>
            <label
              htmlFor="activity-priority"
              className={labelClass}
            >
              Prioridad *
            </label>

            <select
              id="activity-priority"
              value={form.priority}
              onChange={(event) =>
                changeField('priority', event.target.value)
              }
              disabled={saving}
              className={inputClass}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-status"
              className={labelClass}
            >
              Estado
            </label>

            <select
              id="activity-status"
              value={form.status}
              onChange={(event) =>
                changeField('status', event.target.value)
              }
              disabled={saving}
              className={inputClass}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving || subjectsLoading}
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear actividad'}
          </button>
        </div>
      </form>
    </section>
  )
}
