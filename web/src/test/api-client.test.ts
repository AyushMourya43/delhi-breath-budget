import { afterEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}));

vi.mock("../lib/mock-api", () => ({ mockRequest }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("API client", () => {
  it("uses mock responses when mock mode is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
    mockRequest.mockResolvedValue({ points: [] });
    vi.resetModules();

    const { apiGet } = await import("../lib/api-client");
    const response = await apiGet<{ points: unknown[] }>("/aqi-grid");

    expect(response).toEqual({ points: [] });
    expect(mockRequest).toHaveBeenCalledWith("/aqi-grid");
  });

  it("surfaces non-success responses from the real API", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000");
    vi.stubEnv("NEXT_PUBLIC_API_PREFIX", "/api");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    );
    vi.resetModules();

    const { ApiError, apiGet } = await import("../lib/api-client");

    await expect(apiGet("/aqi-grid")).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/aqi-grid",
      expect.objectContaining({ method: "GET", cache: "no-store" })
    );
  });
});