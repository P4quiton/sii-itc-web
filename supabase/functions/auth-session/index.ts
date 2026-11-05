import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import { loadSession, expiredSessionCookie, revokeSession } from "../_shared/session.ts";
import { siiRequest } from "../_shared/sii-client.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "GET") {
      return errorResponse(new ApiError(405, "METHOD_NOT_ALLOWED", "Este endpoint solo acepta GET."));
    }
    try {
      const session = await loadSession(ctx.supabaseAdmin, request);
      let upstream: Awaited<ReturnType<typeof siiRequest>>;
      try {
        upstream = await siiRequest("/api/movil/estudiante", { token: session.token });
      } catch {
        throw new ApiError(502, "SII_UNAVAILABLE", "No fue posible validar la sesión ante el SII ITC.");
      }
      if (upstream.status === 401) {
        await revokeSession(ctx.supabaseAdmin, session.hash);
        throw new ApiError(401, "INVALID_SESSION", "La sesión no es válida o expiró.");
      }
      const profile = upstream.data as { code?: number; flag?: boolean; data?: { numero_control?: string } };
      if (!upstream.ok || profile?.code !== 200 || profile.flag !== true || profile.data?.numero_control?.trim() !== session.studentId) {
        throw new ApiError(502, "SII_INVALID_RESPONSE", "El SII ITC devolvió un perfil inesperado.");
      }
      return jsonResponse({ data: { authenticated: true, expires_at: session.expiresAt, csrf_token: session.csrfToken } });
    } catch (error) {
      const expire = error instanceof ApiError && error.status === 401;
      return errorResponse(error, expire ? { "Set-Cookie": expiredSessionCookie() } : {});
    }
  }),
};
