import { mockRequest } from "./mock-api";

// NEXT_PUBLIC_USE_MOCK=false karoge tabhi real engine use hoga.
export const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// Engine ka prefix: PRD ke hisaab se "/api", agar engine "/api/v1" use kare to env mein badal do.
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  if (isMockMode) {
    return mockRequest<T>(path);
  }

  const { method = "GET", body, signal } = options;

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new ApiError(`Request failed: ${method} ${path}`, res.status);
  }

  return (await res.json()) as T;
}

export function apiGet<T>(path: string, signal?: AbortSignal) {
  return apiRequest<T>(path, { method: "GET", signal });
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal) {
  return apiRequest<T>(path, { method: "POST", body, signal });
}