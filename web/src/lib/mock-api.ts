// Mock data web/public/mock/*.json se aata hai.
const MOCK_FILES: Record<string, string> = {
  "/aqi-grid": "/mock/aqi-grid.json",
  "/fires": "/mock/fires.json",
  "/wind": "/mock/wind.json",
  "/routes": "/mock/routes.json",
  "/safe-window": "/mock/safe-window.json",
  "/advice": "/mock/advice.json",
};

const MOCK_DELAY_MS = 300; // loading state test karne ke liye

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockRequest<T>(path: string): Promise<T> {
  const file = MOCK_FILES[path];
  if (!file) {
    throw new Error(`Mock file not configured for path: ${path}`);
  }

  await sleep(MOCK_DELAY_MS);

  const res = await fetch(file, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Mock file load failed (${res.status}): ${file}`);
  }
  return (await res.json()) as T;
}