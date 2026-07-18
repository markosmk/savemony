/**
 * API Core — Base request function used by all domain modules.
 * Uses cookies (HttpOnly) for auth — no localStorage tokens.
 */

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  // FIXME: remove, only to tests delays and skeletons
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(errorPayload.message || errorPayload.error || `HTTP request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
