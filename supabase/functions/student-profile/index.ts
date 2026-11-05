import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { authenticateStudent } from "../_shared/auth.ts";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "GET") {
      return errorResponse(
        new ApiError(405, "METHOD_NOT_ALLOWED", "Este endpoint solo acepta GET."),
      );
    }

    try {
      const { profile } = await authenticateStudent(req, ctx.supabaseAdmin);
      return jsonResponse(profile);
    } catch (error) {
      return errorResponse(error);
    }
  }),
};
