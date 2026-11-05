const SII_BASE_URL = "https://sii.celaya.tecnm.mx";

type SiiRequestOptions = {
  method?: "GET" | "POST";
  token?: string;
  body?: unknown;
};

type SiiResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

export async function siiRequest(
  path: string,
  options: SiiRequestOptions = {},
): Promise<SiiResult> {
  const url = new URL(path, SII_BASE_URL);

  // Evita que una ruta accidental dirija la solicitud a otro dominio.
  if (url.origin !== SII_BASE_URL) {
    throw new Error("La ruta debe pertenecer al dominio del SII ITC.");
  }

  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined
      ? undefined
      : JSON.stringify(options.body),
  });

  const rawBody = await response.text();
  let data: unknown = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
