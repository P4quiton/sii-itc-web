
export default function PlaceholderPage({ title }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-blue-700">
          {title}
        </h1>

        <p className="mt-3 text-gray-600">
          Sección en desarrollo
        </p>
      </div>
    </main>
  )
}
