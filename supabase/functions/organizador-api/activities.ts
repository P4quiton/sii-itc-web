import { ApiError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";
import {
  escapeLikePattern,
  parseActivityInput,
  parseListFilters,
  quotePostgrestValue,
  readJsonObject,
  type ActivityRow,
} from "./validation.ts";

const TABLE = "academic_activities";
const ACTIVITY_COLUMNS =
  "id,title,description,subject,activity_type,due_date,priority,status,estimated_minutes,created_at,updated_at";

function databaseError(): ApiError {
  return new ApiError(
    500,
    "DATABASE_ERROR",
    "No fue posible completar la operación en la base de datos.",
  );
}

export async function listActivities(
  db: any,
  studentId: string,
  url: URL,
): Promise<Response> {
  const filters = parseListFilters(url);
  let query = db
    .from(TABLE)
    .select(ACTIVITY_COLUMNS, { count: "exact" })
    .eq("student_id", studentId);

  if (filters.subject) {
    query = query.ilike("subject", `%${escapeLikePattern(filters.subject)}%`);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.activityType) query = query.eq("activity_type", filters.activityType);
  if (filters.dueFrom) query = query.gte("due_date", filters.dueFrom);
  if (filters.dueTo) query = query.lte("due_date", filters.dueTo);
  if (filters.search) {
    const pattern = quotePostgrestValue(`%${escapeLikePattern(filters.search)}%`);
    query = query.or(
      `title.ilike.${pattern},description.ilike.${pattern},subject.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (error) throw databaseError();
  const activities = (data ?? []) as ActivityRow[];
  const total = count ?? 0;
  return jsonResponse({
    data: activities,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total,
      has_more: filters.offset + activities.length < total,
    },
  });
}

export async function createActivity(
  db: any,
  studentId: string,
  request: Request,
): Promise<Response> {
  const body = await readJsonObject(request);
  const input = parseActivityInput(body, "create");

  // La identidad nunca viene del cuerpo: se asigna desde la sesión validada con el SII.
  const { data, error } = await db
    .from(TABLE)
    .insert({ ...input, student_id: studentId })
    .select(ACTIVITY_COLUMNS)
    .single();

  if (error || !data) throw databaseError();
  return jsonResponse({ data: data as ActivityRow }, 201);
}

export async function getActivity(
  db: any,
  studentId: string,
  id: string,
): Promise<Response> {
  const { data, error } = await db
    .from(TABLE)
    .select(ACTIVITY_COLUMNS)
    .eq("id", id)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw databaseError();
  if (!data) throw new ApiError(404, "NOT_FOUND", "La actividad no existe.");
  return jsonResponse({ data: data as ActivityRow });
}

export async function updateActivity(
  db: any,
  studentId: string,
  id: string,
  request: Request,
): Promise<Response> {
  const body = await readJsonObject(request);
  const input = parseActivityInput(body, "update");

  // El filtro doble evita modificar una actividad que pertenece a otro estudiante.
  const { data, error } = await db
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .eq("student_id", studentId)
    .select(ACTIVITY_COLUMNS)
    .maybeSingle();

  if (error) throw databaseError();
  if (!data) throw new ApiError(404, "NOT_FOUND", "La actividad no existe.");
  return jsonResponse({ data: data as ActivityRow });
}

export async function deleteActivity(
  db: any,
  studentId: string,
  id: string,
): Promise<Response> {
  const { data, error } = await db
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("student_id", studentId)
    .select("id")
    .maybeSingle();

  if (error) throw databaseError();
  if (!data) throw new ApiError(404, "NOT_FOUND", "La actividad no existe.");
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
