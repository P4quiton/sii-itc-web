import { normalizeApiError } from "./errors.ts";

const responseHeaders = {
  "Cache-Control": "no-store",
};

export function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: responseHeaders,
  });
}

export function errorResponse(error: unknown): Response {
  const apiError = normalizeApiError(error);
  const errorBody = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
    },
  };

  return Response.json(errorBody, {
    status: apiError.status,
    headers: responseHeaders,
  });
}
