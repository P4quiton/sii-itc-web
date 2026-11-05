import { ApiError } from "../_shared/errors.ts";
import { jsonResponse } from "../_shared/response.ts";
import type { ActivityRow } from "./validation.ts";

const TABLE = "academic_activities";
const ACTIVITY_COLUMNS =
  "id,title,description,subject,activity_type,due_date,priority,status,estimated_minutes,created_at,updated_at";
const TIME_ZONE = "America/Mexico_City";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PAGE_SIZE = 1000;

function databaseError(): ApiError {
  return new ApiError(
    500,
    "DATABASE_ERROR",
    "No fue posible completar la operación en la base de datos.",
  );
}

async function fetchAllActivities(db: any, studentId: string): Promise<ActivityRow[]> {
  const activities: ActivityRow[] = [];
  let offset = 0;

  // El resumen usa todas las actividades del estudiante, no solo una página del listado.
  while (true) {
    const { data, error } = await db
      .from(TABLE)
      .select(`${ACTIVITY_COLUMNS},student_id`)
      .eq("student_id", studentId)
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw databaseError();
    const page = (data ?? []) as ActivityRow[];
    activities.push(...page);
    if (page.length < PAGE_SIZE) return activities;
    offset += PAGE_SIZE;
  }
}

function localDate(value: string): string {
  // Las fechas límite se agrupan por día calendario de Celaya/México,
  // aunque la base almacene instantes UTC.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function roundHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

function getUrgency(activity: ActivityRow, nowMs: number) {
  const difference = Date.parse(activity.due_date) - nowMs;
  let score = 0;
  const reasons: string[] = [];

  // Solo se aplica el bono temporal más alto; prioridad y estado se suman aparte.
  if (difference < 0) {
    score += 100;
    reasons.push("La fecha límite ya pasó (+100).");
  } else if (difference <= HOUR_MS * 24) {
    score += 80;
    reasons.push("Vence dentro de las próximas 24 horas (+80).");
  } else if (difference <= HOUR_MS * 48) {
    score += 60;
    reasons.push("Vence dentro de las próximas 48 horas (+60).");
  } else if (difference <= DAY_MS * 7) {
    score += 30;
    reasons.push("Vence dentro de los próximos 7 días (+30).");
  }

  if (activity.priority === "alta") {
    score += 20;
    reasons.push("Prioridad alta (+20).");
  } else if (activity.priority === "media") {
    score += 10;
    reasons.push("Prioridad media (+10).");
  }

  if (activity.status === "pendiente") {
    score += 10;
    reasons.push("Estado pendiente (+10).");
  } else {
    score += 5;
    reasons.push("Estado en progreso (+5).");
  }

  const level = score >= 100
    ? "critical"
    : score >= 80
    ? "high"
    : score >= 40
    ? "medium"
    : "low";

  return { score, level, reasons };
}

function buildWorkload(openActivities: ActivityRow[], nowMs: number) {
  // La carga semanal cuenta actividades abiertas que vencen desde ahora
  // hasta siete días después. Lo vencido se informa aparte en deadlines.
  const windowEndMs = nowMs + DAY_MS * 7;
  const windowActivities = openActivities.filter((activity) => {
    const dueMs = Date.parse(activity.due_date);
    return dueMs >= nowMs && dueMs <= windowEndMs;
  });
  const estimatedActivities = windowActivities.filter(
    (activity) => activity.estimated_minutes !== null,
  );
  const estimatedMinutes = estimatedActivities.reduce(
    (sum, activity) => sum + (activity.estimated_minutes ?? 0),
    0,
  );
  const unestimatedCount = windowActivities.length - estimatedActivities.length;
  const estimationStatus = windowActivities.length === 0
    ? "complete"
    : estimatedActivities.length === 0
    ? "unavailable"
    : unestimatedCount > 0
    ? "partial"
    : "complete";
  // Si faltan estimaciones, la suma conocida sigue siendo útil, pero queda
  // marcada como parcial. Si todas faltan, no se asigna nivel de carga.
  const level = estimationStatus === "unavailable"
    ? null
    : estimatedMinutes >= 960
    ? "critical"
    : estimatedMinutes >= 480
    ? "high"
    : "normal";

  let explanation: string;
  if (windowActivities.length === 0) {
    explanation = "No hay actividades abiertas con vencimiento en los próximos 7 días; la carga estimada es 0 horas.";
  } else if (estimationStatus === "unavailable") {
    explanation = `Hay ${windowActivities.length} actividades abiertas con vencimiento en los próximos 7 días, pero ninguna tiene tiempo estimado; no se puede clasificar la carga.`;
  } else {
    explanation = `Hay ${windowActivities.length} actividades abiertas con vencimiento en los próximos 7 días; se estiman ${roundHours(estimatedMinutes)} horas de trabajo.`;
    if (estimationStatus === "partial") {
      explanation += ` El cálculo es parcial porque ${unestimatedCount} actividad${unestimatedCount === 1 ? "" : "es"} no tiene${unestimatedCount === 1 ? "" : "n"} tiempo estimado.`;
    }
  }

  return {
    estimatedMinutes,
    unestimatedCount,
    estimationStatus,
    level,
    explanation,
    windowEndMs,
  };
}

function buildDeadlineClusters(openActivities: ActivityRow[], nowMs: number) {
  // Agrupa solo fechas futuras dentro de la ventana de siete días y conserva
  // los días con al menos dos actividades para señalar concentración.
  const endMs = nowMs + DAY_MS * 7;
  const byDate = new Map<string, { count: number; minutes: number }>();

  for (const activity of openActivities) {
    const dueMs = Date.parse(activity.due_date);
    if (dueMs <= nowMs || dueMs > endMs) continue;
    const date = localDate(activity.due_date);
    const current = byDate.get(date) ?? { count: 0, minutes: 0 };
    current.count += 1;
    current.minutes += activity.estimated_minutes ?? 0;
    byDate.set(date, current);
  }

  return [...byDate.entries()]
    .filter(([, value]) => value.count >= 2)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      active_count: value.count,
      estimated_minutes: value.minutes,
      description: `${value.count} actividades vencen este día; suman ${roundHours(value.minutes)} horas estimadas.`,
    }));
}

function buildSummary(activities: ActivityRow[]) {
  const now = new Date();
  const nowMs = now.getTime();
  const windowEndMs = nowMs + DAY_MS * 7;
  const next48hMs = nowMs + HOUR_MS * 48;
  const openActivities = activities.filter((activity) => activity.status !== "completada");
  // Vencidas y próximas se calculan solo sobre trabajo abierto. Las ventanas
  // de 48 horas y 7 días incluyen fechas futuras, no actividades vencidas.
  const overdue = openActivities.filter((activity) => Date.parse(activity.due_date) < nowMs).length;
  const dueNext48h = openActivities.filter((activity) => {
    const dueMs = Date.parse(activity.due_date);
    return dueMs > nowMs && dueMs <= next48hMs;
  }).length;
  const dueNext7d = openActivities.filter((activity) => {
    const dueMs = Date.parse(activity.due_date);
    return dueMs > nowMs && dueMs <= windowEndMs;
  }).length;
  const workload = buildWorkload(openActivities, nowMs);

  // Urgencia ordena vencimiento y estado; no es lo mismo que la carga total.
  // En empates, usa vencimiento y fecha de creación para un orden reproducible.
  const priorityActivities = openActivities
    .map((activity) => ({ activity, urgency: getUrgency(activity, nowMs) }))
    .sort((a, b) =>
      b.urgency.score - a.urgency.score ||
      Date.parse(a.activity.due_date) - Date.parse(b.activity.due_date) ||
      Date.parse(a.activity.created_at) - Date.parse(b.activity.created_at)
    )
    .slice(0, 10)
    .map(({ activity, urgency }) => ({
      id: activity.id,
      title: activity.title,
      subject: activity.subject,
      activity_type: activity.activity_type,
      due_date: activity.due_date,
      priority: activity.priority,
      status: activity.status,
      estimated_minutes: activity.estimated_minutes,
      urgency_score: urgency.score,
      urgency_level: urgency.level,
      urgency_reasons: urgency.reasons,
    }));

  return {
    data: {
      generated_at: now.toISOString(),
      timezone: TIME_ZONE,
      totals: {
        total: activities.length,
        pending: activities.filter((activity) => activity.status === "pendiente").length,
        in_progress: activities.filter((activity) => activity.status === "en_progreso").length,
        completed: activities.filter((activity) => activity.status === "completada").length,
      },
      deadlines: {
        overdue,
        due_next_48h: dueNext48h,
        due_next_7d: dueNext7d,
      },
      workload: {
        window_start: now.toISOString(),
        window_end: new Date(workload.windowEndMs).toISOString(),
        estimated_minutes: workload.estimatedMinutes,
        estimated_hours: roundHours(workload.estimatedMinutes),
        level: workload.level,
        estimation_status: workload.estimationStatus,
        unestimated_activity_count: workload.unestimatedCount,
        thresholds_minutes: { high: 480, critical: 960 },
        explanation: workload.explanation,
      },
      deadline_clusters: buildDeadlineClusters(openActivities, nowMs),
      priority_activities: priorityActivities,
    },
  };
}

export async function getSummary(db: any, studentId: string): Promise<Response> {
  const activities = await fetchAllActivities(db, studentId);
  return jsonResponse(buildSummary(activities));
}
