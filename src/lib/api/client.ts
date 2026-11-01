
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type ApiOptions = RequestInit & {
  headers?: HeadersInit;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || `Request failed: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}
