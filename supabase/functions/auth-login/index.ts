import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { siiRequest } from "../_shared/sii-client.ts";
import { createSession, isLegacyOrigin, requireAllowedOrigin, sessionCookie } from "../_shared/session.ts";

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

function institutionalToken(value: unknown): string {
  return (value as { message: { login: { token: string } } }).message.login.token.trim();
}

function hasStatus(value: unknown, status: number): boolean {
  return isRecord(value) && value.status === status;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
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
      requireAllowedOrigin(req);
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

    // Mantiene funcionando el frontend de producción anterior hasta el corte coordinado.
    if (isLegacyOrigin(req)) {
      return jsonResponse(upstream.data);
    }

    const token = institutionalToken(upstream.data);
    let profileResult: Awaited<ReturnType<typeof siiRequest>>;
    try {
      profileResult = await siiRequest("/api/movil/estudiante", { token });
    } catch {
      return errorResponse(new ApiError(502, "SII_UNAVAILABLE", "No fue posible validar la sesión ante el SII ITC."));
    }
    const profile = profileResult.data as { code?: number; flag?: boolean; data?: { numero_control?: string } };
    if (profileResult.status === 401) {
      return errorResponse(new ApiError(401, "INVALID_CREDENTIALS", "El SII ITC rechazó las credenciales."));
    }
    if (!profileResult.ok || profile?.code !== 200 || profile.flag !== true || typeof profile.data?.numero_control !== "string") {
      return errorResponse(new ApiError(502, "SII_INVALID_RESPONSE", "El SII ITC devolvió un perfil inesperado."));
    }

    try {
      const session = await createSession(ctx.supabaseAdmin, token, profile.data.numero_control.trim());
      return jsonResponse({
        data: { authenticated: true, expires_at: session.expiresAt, csrf_token: session.csrfToken },
      }, 200, { "Set-Cookie": sessionCookie(session.sessionId, session.maxAge) });
    } catch (error) {
      return errorResponse(error);
    }
  }),
};
