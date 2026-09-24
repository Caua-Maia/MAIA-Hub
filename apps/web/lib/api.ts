export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "Não foi possível concluir";
  } catch {
    return "Não foi possível concluir";
  }
}
