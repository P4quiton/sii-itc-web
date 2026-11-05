import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { extractBearerToken } from "../_shared/auth.ts";
import { ApiError } from "../_shared/errors.ts";
import { siiRequest } from "../_shared/sii-client.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScheduleResponse(value: unknown): boolean {
  if (!isRecord(value) || value.code !== 200 || value.flag !== true) {
    return false;
  }

  if (!Array.isArray(value.data)) {
    return false;
  }

  return value.data.every((period) =>
    isRecord(period) && isRecord(period.periodo) && Array.isArray(period.horario)
  );
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req) => {
    if (req.method !== "GET") {
      return errorResponse(
        new ApiError(405, "METHOD_NOT_ALLOWED", "Este endpoint solo acepta GET."),
      );
    }

    try {
      const token = extractBearerToken(req);

      let upstream: Awaited<ReturnType<typeof siiRequest>>;
      try {
        upstream = await siiRequest("/api/movil/estudiante/horarios", { token });
      } catch {
        throw new ApiError(
          502,
          "SII_UNAVAILABLE",
          "No fue posible comunicarse con el SII ITC.",
        );
      }

      if (upstream.status === 401) {
        throw new ApiError(
          401,
          "INVALID_TOKEN",
          "El token institucional no es válido o expiró.",
        );
      }

      if (!upstream.ok) {
        throw new ApiError(
          502,
          "SII_UPSTREAM_ERROR",
          "El SII ITC no pudo consultar el horario.",
        );
      }

      if (!isScheduleResponse(upstream.data)) {
        throw new ApiError(
          502,
          "SII_INVALID_RESPONSE",
          "El SII ITC devolvió una respuesta de horario inesperada.",
        );
      }

      return jsonResponse(upstream.data);
    } catch (error) {
      return errorResponse(error);
    }
  }),
};
