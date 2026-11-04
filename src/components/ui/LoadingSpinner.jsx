
export default function LoadingSpinner({
  message = 'Cargando información...',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-4"
    >
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700"
      />

      <p className="text-sm font-medium text-slate-500">
        {message}
      </p>
    </div>
  )
}
