import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { authenticateStudent } from "../_shared/auth.ts";
import { ApiError } from "../_shared/errors.ts";
import { errorResponse } from "../_shared/response.ts";
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from "./activities.ts";
import { getSummary } from "./summary.ts";
import { resolveRoute } from "./validation.ts";

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    try {
      const route = resolveRoute(request);
      const { studentId } = await authenticateStudent(request);
      // El cliente admin omite RLS; las consultas filtran por esta identidad verificada.
      const db = ctx.supabaseAdmin;
      const url = new URL(request.url);

      switch (route.kind) {
        case "summary":
          return await getSummary(db, studentId);
        case "list":
          return await listActivities(db, studentId, url);
        case "create":
          return await createActivity(db, studentId, request);
        case "item":
          if (request.method === "GET") {
            return await getActivity(db, studentId, route.id);
          }
          if (request.method === "PATCH") {
            return await updateActivity(db, studentId, route.id, request);
          }
          if (request.method === "DELETE") {
            return await deleteActivity(db, studentId, route.id);
          }
          throw new ApiError(
            405,
            "METHOD_NOT_ALLOWED",
            "El método HTTP no está permitido para esta ruta.",
          );
      }

      throw new ApiError(500, "INTERNAL_ERROR", "No se pudo resolver la operación.");
    } catch (error) {
      return errorResponse(error);
    }
  }),
};
