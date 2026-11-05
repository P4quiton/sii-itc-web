import { normalizeApiError } from "./errors.ts";

const responseHeaders = {
  "Cache-Control": "no-store",
};

export function jsonResponse(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  const mergedHeaders = new Headers(responseHeaders);
  new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));
  return Response.json(data, {
    status,
    headers: mergedHeaders,
  });
}

export function errorResponse(error: unknown, headers: HeadersInit = {}): Response {
  const apiError = normalizeApiError(error);
  const errorBody = {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
    },
  };

  const mergedHeaders = new Headers(responseHeaders);
  new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));
  if (apiError.code === "INVALID_SESSION" && !mergedHeaders.has("Set-Cookie")) {
    mergedHeaders.set(
      "Set-Cookie",
      "sii_session=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    );
  }
  return Response.json(errorBody, {
    status: apiError.status,
    headers: mergedHeaders,
  });
}
