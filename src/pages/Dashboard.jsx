const indicators = [
  {
    title: 'Materias inscritas',
    value: '—',
    description: 'Periodo actual',
  },
  {
    title: 'Promedio general',
    value: '—',
    description: 'Historial académico',
  },
  {
    title: 'Créditos aprobados',
    value: '—',
    description: 'Avance académico',
  },
]

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Consulta tu información académica en un solo lugar.
          </p>
        </header>

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Información del estudiante
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                Nombre completo
              </p>
              <p className="font-medium text-slate-800">
                Pendiente de consulta
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Número de control
              </p>
              <p className="font-medium text-slate-800">
                Pendiente de consulta
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Carrera
              </p>
              <p className="font-medium text-slate-800">
                Pendiente de consulta
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Periodo académico
              </p>
              <p className="font-medium text-slate-800">
                Pendiente de consulta
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Resumen académico
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {indicators.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {item.value}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            Información académica
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Los datos académicos estarán disponibles después
            de iniciar sesión y completar la conexión con el
            backend institucional mediante Supabase.
          </p>
        </section>

      </div>
    </main>
  )
}
