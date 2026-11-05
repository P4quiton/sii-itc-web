import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { siiRequest } from "../_shared/sii-client.ts";

type LoginPayload = {
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLoginPayload(value: unknown): LoginPayload {
  if (!isRecord(value)) {
    throw new ApiError(400, "BAD_REQUEST", "El cuerpo debe ser un objeto JSON.");
  }

  const allowedFields = new Set(["email", "password"]);
  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    throw new ApiError(400, "BAD_REQUEST", "El cuerpo contiene campos no permitidos.");
  }

  if (typeof value.email !== "string" || typeof value.password !== "string") {
    throw new ApiError(400, "BAD_REQUEST", "Se requieren email y password como texto.");
  }

  const email = value.email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email) || value.password.length === 0) {
    throw new ApiError(400, "BAD_REQUEST", "El correo o la contraseña no tienen un formato válido.");
  }

  return { email, password: value.password };
}

function hasInstitutionalToken(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.message) || !isRecord(value.message.login)) {
    return false;
  }

  return typeof value.message.login.token === "string" &&
    value.message.login.token.trim().length > 0;
}

function hasStatus(value: unknown, status: number): boolean {
  return isRecord(value) && value.status === status;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req) => {
    if (req.method !== "POST") {
      return errorResponse(
        new ApiError(405, "METHOD_NOT_ALLOWED", "Este endpoint solo acepta POST."),
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "El Content-Type debe ser application/json."),
      );
    }

    let payload: LoginPayload;
    try {
      payload = parseLoginPayload(await req.json());
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error);
      }

      return errorResponse(
        new ApiError(400, "BAD_REQUEST", "El cuerpo no contiene JSON válido."),
      );
    }

    let upstream: Awaited<ReturnType<typeof siiRequest>>;
    try {
      upstream = await siiRequest("/api/login", {
        method: "POST",
        body: payload,
      });
    } catch {
      return errorResponse(
        new ApiError(502, "SII_UNAVAILABLE", "No fue posible comunicarse con el SII ITC."),
      );
    }

    if (upstream.status === 401 || hasStatus(upstream.data, 401)) {
      return errorResponse(
        new ApiError(401, "INVALID_CREDENTIALS", "El SII ITC rechazó las credenciales."),
      );
    }

    if (!upstream.ok) {
      return errorResponse(
        new ApiError(502, "SII_UPSTREAM_ERROR", "El SII ITC no pudo procesar la solicitud."),
      );
    }

    if (!hasInstitutionalToken(upstream.data)) {
      return errorResponse(
        new ApiError(502, "SII_INVALID_RESPONSE", "El SII ITC devolvió una respuesta inesperada."),
      );
    }

    return jsonResponse(upstream.data);
  }),
};
