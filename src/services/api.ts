// Very small API helper providing only GET and token management
const DEFAULT_TIMEOUT = 15000;
// Default to the official Albion data API for Europe
let baseUrl = "https://europe.albion-online-data.com";
let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean>) {
  const url = path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  if (!params || Object.keys(params).length === 0) return url;
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) s.append(k, String(v));
  return `${url}?${s.toString()}`;
}

export async function getJson<T = any>(path: string, params?: Record<string, string | number | boolean>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw { status: res.status, statusText: res.statusText, message: `HTTP ${res.status}` };
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return (await res.json()) as T;
    const text = await res.text();
    // try parse fallback
    try { return JSON.parse(text) as T; } catch { return (text as unknown) as T; }
  } catch (e: any) {
    if (e && e.name === "AbortError") throw { message: "Request timed out" };
    throw e;
  }
}

/**
 * Convenience helper for the Albion data API price endpoint.
 * Calls GET on `${baseUrl}/api/v2/stats/prices` with optional query params.
 */
export async function getPrice<T = any>(params?: Record<string, string | number | boolean>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  return getJson<T>("/api/v2/stats/prices", params, timeoutMs);
}

export default { getJson, getPrice, setToken };
