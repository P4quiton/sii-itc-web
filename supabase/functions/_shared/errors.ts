export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // No se exponen mensajes inesperados del runtime al cliente.
  return new ApiError(
    500,
    "INTERNAL_ERROR",
    "Ocurrió un error interno al procesar la solicitud.",
  );
}
