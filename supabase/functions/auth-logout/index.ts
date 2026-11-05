import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse } from "../_shared/response.ts";
import {
  expiredSessionCookie,
  loadSession,
  readSessionId,
  requireAllowedOrigin,
  requireCsrf,
  revokeSession,
} from "../_shared/session.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    const headers = { "Set-Cookie": expiredSessionCookie() };
    if (request.method !== "POST") {
      return errorResponse(new ApiError(405, "METHOD_NOT_ALLOWED", "Este endpoint solo acepta POST."));
    }
    try {
      requireAllowedOrigin(request);
      if (readSessionId(request)) {
        try {
          const session = await loadSession(ctx.supabaseAdmin, request);
          await requireCsrf(request, { csrfHash: session.csrfHash });
          await revokeSession(ctx.supabaseAdmin, session.hash);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) throw error;
        }
      }
      return new Response(null, { status: 204, headers: { ...headers, "Cache-Control": "no-store" } });
    } catch (error) {
      return errorResponse(error);
    }
  }),
};
