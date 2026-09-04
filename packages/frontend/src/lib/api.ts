const API_BASE = import.meta.env.VITE_API_BASE || '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

function handleAuthError() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export async function api<T = unknown>(
  path: string,
  { method = "GET", body, token }: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token != null) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    handleAuthError();
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}
