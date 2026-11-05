import { ApiError } from "./errors.ts";

const COOKIE_NAME = "sii_session";
const COOKIE_PATH = "/api";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function encodeBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(digest));
}

function encryptionKey(): Promise<CryptoKey> {
  const configured = Deno.env.get("SESSION_ENCRYPTION_KEY");
  if (!configured) throw new ApiError(500, "INTERNAL_ERROR", "La sesión no está configurada.");
  const raw = base64ToBytes(configured);
  if (raw.length !== 32) throw new ApiError(500, "INTERNAL_ERROR", "La sesión no está configurada.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function requireAllowedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const configured = [Deno.env.get("APP_ALLOWED_ORIGINS"), Deno.env.get("APP_LEGACY_BEARER_ORIGINS")]
    .filter(Boolean).join(",")
    .split(",").map((item) => item.trim()).filter(Boolean);
  if (!origin || configured.length === 0 || !configured.includes(origin)) {
    throw new ApiError(403, "CSRF_REJECTED", "El origen de la solicitud no está permitido.");
  }
}

export function isLegacyOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const allowed = (Deno.env.get("APP_LEGACY_BEARER_ORIGINS") ?? "")
    .split(",").map((item) => item.trim()).filter(Boolean);
  return Boolean(origin && allowed.includes(origin));
}

export function isLegacyBearerRequest(request: Request): boolean {
  return isLegacyOrigin(request) && /^Bearer\s+\S+/i.test(request.headers.get("authorization") ?? "");
}

export function sessionCookie(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${value}; Path=${COOKIE_PATH}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function expiredSessionCookie(): string {
  return sessionCookie("", 0);
}

export function readSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const value = entry?.slice(COOKIE_NAME.length + 1);
  return value && /^[A-Za-z0-9_-]{40,}$/.test(value) ? value : null;
}

function tokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error("JWT payload missing");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now()) throw new Error("JWT expiry missing");
    return decoded.exp * 1000;
  } catch {
    throw new ApiError(502, "SII_INVALID_RESPONSE", "El SII ITC devolvió un token sin expiración válida.");
  }
}

export async function createSession(db: any, token: string, studentId: string) {
  const sessionId = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const csrfToken = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const csrfIv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(sessionId) },
    key,
    new TextEncoder().encode(token),
  );
  const encryptedCsrf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: csrfIv, additionalData: new TextEncoder().encode(`${sessionId}:csrf`) },
    key,
    new TextEncoder().encode(csrfToken),
  );
  const expiresAtMs = Math.min(tokenExpiry(token), Date.now() + DEFAULT_TTL_SECONDS * 1000);
  const expiresAt = new Date(expiresAtMs).toISOString();
  const { error } = await db.from("student_sessions").insert({
    session_hash: await sha256(sessionId),
    student_id: studentId,
    sii_token_ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    sii_token_iv: bytesToBase64(iv),
    csrf_token_ciphertext: bytesToBase64(new Uint8Array(encryptedCsrf)),
    csrf_token_iv: bytesToBase64(csrfIv),
    csrf_hash: await sha256(csrfToken),
    expires_at: expiresAt,
  });
  if (error) throw new ApiError(500, "DATABASE_ERROR", "No fue posible crear la sesión.");
  return { sessionId, csrfToken, expiresAt, maxAge: Math.max(1, Math.floor((expiresAtMs - Date.now()) / 1000)) };
}

export async function loadSession(db: any, request: Request) {
  const sessionId = readSessionId(request);
  if (!sessionId) throw new ApiError(401, "INVALID_SESSION", "La sesión no es válida o expiró.");
  const hash = await sha256(sessionId);
  const { data, error } = await db.from("student_sessions")
    .select("session_hash,student_id,sii_token_ciphertext,sii_token_iv,csrf_token_ciphertext,csrf_token_iv,csrf_hash,expires_at,revoked_at")
    .eq("session_hash", hash).maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "No fue posible consultar la sesión.");
  if (!data || data.revoked_at || Date.parse(data.expires_at) <= Date.now()) {
    throw new ApiError(401, "INVALID_SESSION", "La sesión no es válida o expiró.");
  }
  const key = await encryptionKey();
  let token: string;
  let csrfToken: string;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(data.sii_token_iv), additionalData: new TextEncoder().encode(sessionId) },
      key,
      base64ToBytes(data.sii_token_ciphertext),
    );
    token = new TextDecoder().decode(plaintext);
    const csrfPlaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(data.csrf_token_iv), additionalData: new TextEncoder().encode(`${sessionId}:csrf`) },
      key,
      base64ToBytes(data.csrf_token_ciphertext),
    );
    csrfToken = new TextDecoder().decode(csrfPlaintext);
    if (await sha256(csrfToken) !== data.csrf_hash) throw new Error("CSRF token integrity check failed");
  } catch {
    throw new ApiError(401, "INVALID_SESSION", "La sesión no es válida o expiró.");
  }
  return { sessionId, hash, token, csrfToken, studentId: data.student_id, csrfHash: data.csrf_hash, expiresAt: data.expires_at };
}

export async function requireCsrf(request: Request, session: { csrfHash: string }): Promise<void> {
  requireAllowedOrigin(request);
  const supplied = request.headers.get("x-csrf-token") ?? "";
  if (!supplied || await sha256(supplied) !== session.csrfHash) {
    throw new ApiError(403, "CSRF_REJECTED", "El token CSRF no es válido.");
  }
}

export async function revokeSession(db: any, hash: string): Promise<void> {
  const { error } = await db.from("student_sessions").update({ revoked_at: new Date().toISOString() })
    .eq("session_hash", hash).is("revoked_at", null);
  if (error) throw new ApiError(500, "DATABASE_ERROR", "No fue posible cerrar la sesión.");
}
