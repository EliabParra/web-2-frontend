const API_URL = import.meta.env.VITE_API_URL ?? "";

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiBody {
  msg?: string;
  alerts?: string[];
  data?: unknown;
  csrfToken?: string;
}

let csrfToken: string | null = null;

async function readBody(res: Response): Promise<ApiBody> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function fetchCsrfToken(): Promise<string> {
  const body = await readBody(await fetch(`${API_URL}/csrf`, { credentials: "include" }));
  csrfToken = body.csrfToken ?? "";
  return csrfToken;
}

function send(path: string, body: unknown, token: string) {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify(body ?? {}),
  });
}

function errorMessage(body: ApiBody): string {
  const alerts = Array.isArray(body.alerts) ? body.alerts.join(". ") : "";
  return [body.msg, alerts].filter(Boolean).join(": ") || "Error de comunicación con el servidor";
}

/** POST with the session CSRF token; a 403 refetches the token and retries once. */
export async function post<T>(path: string, body?: unknown): Promise<T> {
  let res = await send(path, body, csrfToken ?? (await fetchCsrfToken()));
  if (res.status === 403) res = await send(path, body, await fetchCsrfToken());

  const data = await readBody(res);
  if (!res.ok) throw new ApiError(errorMessage(data), res.status);
  return data as T;
}

/**
 * Runs a backend transaction. Without a valid session the backend answers 401
 * ("Debe iniciar sesión") or 403 (public profile without privileges), so both log out.
 */
export async function tx<T>(id: number, params: Record<string, unknown> = {}): Promise<T> {
  try {
    const body = await post<ApiBody>("/toProccess", { tx: id, params });
    return body.data as T;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw error;
  }
}
