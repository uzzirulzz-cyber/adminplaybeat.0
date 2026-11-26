export const TOKEN_KEY = "pb_admin_token_v2";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function redirectToLogin() {
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login")
  ) {
    window.location.href = "/login/?expired=1";
  }
}

export async function api<T = Record<string, unknown>>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    throw new ApiError("Admin sign-in required.", 401);
  }
  const headers: Record<string, string> = { ...(init.headers as any) };
  headers["Authorization"] = "Bearer " + token;
  if (init.body) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch (err: any) {
    throw new ApiError("Network error: " + (err?.message || "fetch failed"), 0);
  }
  if (res.status === 401) {
    clearToken();
    redirectToLogin();
    throw new ApiError("Admin sign-in required.", 401);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as any)?.error || "Request failed (HTTP " + res.status + ")",
      res.status
    );
  }
  return data as T;
}

export async function adminLogin(password: string) {
  let res: Response;
  try {
    res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch (err: any) {
    throw new ApiError("Network error: " + (err?.message || "fetch failed"), 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !(data as any).ok) {
    throw new ApiError(
      (data as any).error || "Incorrect admin password.",
      res.status
    );
  }
  setToken((data as any).token);
  return data;
}

export async function adminLoginWithIdToken(idToken: string) {
  let res: Response;
  try {
    res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (err: any) {
    throw new ApiError("Network error: " + (err?.message || "fetch failed"), 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !(data as any).ok) {
    throw new ApiError(
      (data as any).error || "Firebase sign-in rejected.",
      res.status
    );
  }
  setToken((data as any).token);
  return data;
}

export const FIREBASE_BRIDGE_URL =
  "https://playbeat.digital/firebase-bridge";
export const BRIDGE_ORIGIN = "https://playbeat.digital";

export function fmtUsd(n: number | undefined | null) {
  return "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function fmtDate(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
