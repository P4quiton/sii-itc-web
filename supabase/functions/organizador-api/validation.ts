import { ApiError } from "../_shared/errors.ts";

// Estos valores deben mantenerse alineados con los enums de docs/openapi.yaml y SQL.
export const ACTIVITY_TYPES = ["tarea", "proyecto", "examen", "otro"] as const;
export const ACTIVITY_PRIORITIES = ["baja", "media", "alta"] as const;
export const ACTIVITY_STATUSES = ["pendiente", "en_progreso", "completada"] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];
export type ActivityPriority = typeof ACTIVITY_PRIORITIES[number];
export type ActivityStatus = typeof ACTIVITY_STATUSES[number];

export type ActivityRow = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: ActivityType;
  due_date: string;
  priority: ActivityPriority;
  status: ActivityStatus;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type ActivityInput = {
  title?: string;
  description?: string | null;
  subject?: string | null;
  activity_type?: ActivityType;
  due_date?: string;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  estimated_minutes?: number | null;
};

export type ListFilters = {
  subject: string | null;
  search: string | null;
  status: ActivityStatus | null;
  priority: ActivityPriority | null;
  activityType: ActivityType | null;
  dueFrom: string | null;
  dueTo: string | null;
  limit: number;
  offset: number;
};

export type Route =
  | { kind: "summary" }
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "item"; id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Centraliza los errores de validación para responder con el mismo formato 422.
function validationError(message: string, details?: unknown): ApiError {
  return new ApiError(422, "VALIDATION_ERROR", message, details);
}

function parseRoutePath(requestUrl: string): string {
  const pathname = new URL(requestUrl).pathname;
  const functionPath = "/organizador-api";
  const functionIndex = pathname.lastIndexOf(functionPath);
  // Supabase entrega el pathname completo; se elimina el prefijo de la función.
  const route = functionIndex >= 0
    ? pathname.slice(functionIndex + functionPath.length)
    : pathname;
  return route.replace(/\/+$/, "") || "/";
}

export function resolveRoute(request: Request): Route {
  // Convierte método + ruta en una operación interna; así el handler no repite
  // comparaciones de URL y también devuelve errores claros para rutas inválidas.
  const path = parseRoutePath(request.url);

  if (path === "/summary" && request.method === "GET") {
    return { kind: "summary" };
  }
  if (path === "/activities" && request.method === "GET") {
    return { kind: "list" };
  }
  if (path === "/activities" && request.method === "POST") {
    return { kind: "create" };
  }

  const itemMatch = /^\/activities\/([^/]+)$/.exec(path);
  if (itemMatch && ["GET", "PATCH", "DELETE"].includes(request.method)) {
    const id = itemMatch[1];
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(id)) {
      throw new ApiError(400, "BAD_REQUEST", "El id debe ser un UUID válido.");
    }
    return { kind: "item", id };
  }

  if (path === "/summary" || path === "/activities" || itemMatch) {
    throw new ApiError(
      405,
      "METHOD_NOT_ALLOWED",
      "El método HTTP no está permitido para esta ruta.",
    );
  }

  throw new ApiError(404, "NOT_FOUND", "La ruta solicitada no existe.");
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: string[],
): void {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    // Así se rechazan también campos sensibles como student_id enviados por React.
    throw validationError("La solicitud contiene campos no permitidos.", {
      fields: unexpected,
    });
  }
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  // Verifica tipo de contenido, sintaxis JSON y que la raíz sea un objeto.
  // Los arreglos, null y valores escalares no sirven como entrada del CRUD.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "El cuerpo debe enviarse como application/json.",
    );
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "El cuerpo JSON no es válido.");
  }

  if (!isRecord(value)) {
    throw validationError("El cuerpo debe ser un objeto JSON.");
  }
  return value;
}

function parseDateTime(value: unknown, field: string): string {
  // Exigir zona horaria evita interpretar una fecha local de forma ambigua.
  const rfc3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i;
  if (typeof value !== "string" || !rfc3339.test(value) || !Number.isFinite(Date.parse(value))) {
    throw validationError(`${field} debe ser una fecha y hora RFC 3339 con zona horaria.`, {
      field,
    });
  }
  return new Date(value).toISOString();
}

export function parseActivityInput(
  value: Record<string, unknown>,
  mode: "create" | "update",
): ActivityInput {
  const allowed = [
    "title",
    "description",
    "subject",
    "activity_type",
    "due_date",
    "priority",
    "status",
    "estimated_minutes",
  ];
  // Lista blanca: evita aceptar propiedades internas, incluido student_id.
  assertAllowedKeys(value, allowed);

  if (mode === "update" && Object.keys(value).length === 0) {
    throw validationError("Debe enviar al menos un campo para actualizar.");
  }

  if (mode === "create") {
    // En creación se requieren estos campos; status tiene el default pendiente.
    for (const field of ["title", "activity_type", "due_date", "priority"]) {
      if (!(field in value)) {
        throw validationError(`El campo ${field} es obligatorio.`, { field });
      }
    }
  }

  const input: ActivityInput = {};

  if ("title" in value) {
    if (typeof value.title !== "string") {
      throw validationError("title debe ser texto.", { field: "title" });
    }
    const title = value.title.trim();
    if (title.length < 1 || title.length > 200) {
      throw validationError("title debe tener entre 1 y 200 caracteres.", {
        field: "title",
      });
    }
    input.title = title;
  }

  for (const field of ["description", "subject"] as const) {
    if (!(field in value)) continue;
    const fieldValue = value[field];
    const maxLength = field === "description" ? 5000 : 200;
    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw validationError(`${field} debe ser texto o null.`, { field });
    }
    if (typeof fieldValue === "string" && fieldValue.length > maxLength) {
      throw validationError(`${field} no puede superar ${maxLength} caracteres.`, {
        field,
      });
    }
    input[field] = typeof fieldValue === "string" ? fieldValue.trim() : null;
  }

  if ("activity_type" in value) {
    if (typeof value.activity_type !== "string" ||
      !ACTIVITY_TYPES.includes(value.activity_type as ActivityType)) {
      throw validationError("activity_type no es un valor permitido.", {
        field: "activity_type",
        allowed: ACTIVITY_TYPES,
      });
    }
    input.activity_type = value.activity_type as ActivityType;
  }

  if ("due_date" in value) {
    input.due_date = parseDateTime(value.due_date, "due_date");
  }

  if ("priority" in value) {
    if (typeof value.priority !== "string" ||
      !ACTIVITY_PRIORITIES.includes(value.priority as ActivityPriority)) {
      throw validationError("priority no es un valor permitido.", {
        field: "priority",
        allowed: ACTIVITY_PRIORITIES,
      });
    }
    input.priority = value.priority as ActivityPriority;
  }

  if ("status" in value) {
    if (typeof value.status !== "string" ||
      !ACTIVITY_STATUSES.includes(value.status as ActivityStatus)) {
      throw validationError("status no es un valor permitido.", {
        field: "status",
        allowed: ACTIVITY_STATUSES,
      });
    }
    input.status = value.status as ActivityStatus;
  }

  if ("estimated_minutes" in value) {
    const estimate = value.estimated_minutes;
    if (estimate !== null &&
      (typeof estimate !== "number" || !Number.isInteger(estimate) || estimate < 1)) {
      throw validationError("estimated_minutes debe ser un entero positivo o null.", {
        field: "estimated_minutes",
      });
    }
    input.estimated_minutes = estimate as number | null;
  }

  if (mode === "create" && !("status" in input)) {
    // El contrato permite omitir status al crear; se inicia como pendiente.
    input.status = "pendiente";
  }

  return input;
}

function parseEnumFilter<T extends string>(
  value: string | null,
  field: string,
  allowed: readonly T[],
): T | null {
  // Los filtros de enum usan exactamente los mismos valores que el cuerpo CRUD.
  if (value === null) return null;
  if (!allowed.includes(value as T)) {
    throw validationError(`${field} no es un valor permitido.`, {
      field,
      allowed,
    });
  }
  return value as T;
}

function parseIntegerQuery(
  value: string | null,
  field: string,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  // Rechaza decimales, signos y valores fuera del intervalo permitido.
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) {
    throw validationError(`${field} debe ser un entero válido.`, { field });
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw validationError(`${field} está fuera del rango permitido.`, { field });
  }
  return number;
}

function getQueryText(
  params: URLSearchParams,
  field: string,
  maxLength: number,
): string | null {
  // Normaliza espacios y limita texto de búsqueda para acotar la consulta.
  const value = params.get(field);
  if (value === null) return null;
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw validationError(`${field} no puede superar ${maxLength} caracteres.`, {
      field,
    });
  }
  return normalized || null;
}

export function escapeLikePattern(value: string): string {
  // Trata %, _ y \ como texto literal para que la búsqueda no amplíe el patrón.
  return value.replace(/[\\%_]/g, "\\$&");
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

export function parseListFilters(url: URL): ListFilters {
  const params = url.searchParams;
  const subject = getQueryText(params, "subject", 200);
  const search = getQueryText(params, "search", 200);
  const status = parseEnumFilter(params.get("status"), "status", ACTIVITY_STATUSES);
  const priority = parseEnumFilter(params.get("priority"), "priority", ACTIVITY_PRIORITIES);
  const activityType = parseEnumFilter(
    params.get("activity_type"),
    "activity_type",
    ACTIVITY_TYPES,
  );
  const dueFromParam = params.get("due_from");
  const dueToParam = params.get("due_to");
  const dueFrom = dueFromParam === null ? null : parseDateTime(dueFromParam, "due_from");
  const dueTo = dueToParam === null ? null : parseDateTime(dueToParam, "due_to");

  if (dueFrom && dueTo && Date.parse(dueFrom) > Date.parse(dueTo)) {
    throw validationError("due_from no puede ser posterior a due_to.", {
      fields: ["due_from", "due_to"],
    });
  }

  // Se limita el tamaño de página para acotar el trabajo y el tamaño de respuesta.
  const limit = parseIntegerQuery(
    params.get("limit"),
    "limit",
    50,
    1,
    100,
  );
  const offset = parseIntegerQuery(params.get("offset"), "offset", 0, 0);

  return { subject, search, status, priority, activityType, dueFrom, dueTo, limit, offset };
}
