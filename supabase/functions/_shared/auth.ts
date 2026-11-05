import { ApiError } from "./errors.ts";
import { siiRequest } from "./sii-client.ts";

type StudentProfileData = Record<string, unknown> & {
  numero_control: string;
};

type StudentProfilePayload = {
  code: number;
  message: string;
  flag: boolean;
  data: StudentProfileData;
};

export type AuthenticatedStudent = {
  token: string;
  studentId: string;
  profile: StudentProfilePayload;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const token = match?.[1]?.trim();

  if (!token) {
    throw new ApiError(
      401,
      "INVALID_TOKEN",
      "Se requiere un token institucional válido.",
    );
  }

  return token;
}

function parseStudentProfile(value: unknown): StudentProfilePayload | null {
  if (!isRecord(value) || value.code !== 200 || value.flag !== true) {
    return null;
  }

  if (!isRecord(value.data)) {
    return null;
  }

  const studentId = value.data.numero_control;
  if (typeof studentId !== "string" || studentId.trim().length === 0) {
    return null;
  }

  return value as StudentProfilePayload;
}

export async function authenticateStudent(
  request: Request,
): Promise<AuthenticatedStudent> {
  const token = extractBearerToken(request);

  let upstream: Awaited<ReturnType<typeof siiRequest>>;
  try {
    upstream = await siiRequest("/api/movil/estudiante", { token });
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
      "El SII ITC no pudo validar la sesión.",
    );
  }

  const profile = parseStudentProfile(upstream.data);
  if (!profile) {
    throw new ApiError(
      502,
      "SII_INVALID_RESPONSE",
      "El SII ITC devolvió un perfil inesperado.",
    );
  }

  return {
    token,
    studentId: profile.data.numero_control.trim(),
    profile,
  };
}
