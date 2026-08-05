const MAX_RETRIES = 3;
const BASE_DELAY_MS = 800;
const FETCH_TIMEOUT_MS = 10_000; // por tentativa
const MAX_RETRY_DELAY_MS = 5_000; // teto pro backoff/retry-after

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  revalidateSeconds: number,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: revalidateSeconds },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPncp(
  url: string,
  revalidateSeconds = 120
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, revalidateSeconds, FETCH_TIMEOUT_MS);

      if (response.status !== 429) {
        return response;
      }

      lastResponse = response;
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
      const delay = Math.min(retryAfterMs ?? BASE_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);

      console.warn(
        `[v0] PNCP 429 (${url}) - tentativa ${attempt + 1}/${MAX_RETRIES}, aguardando ${delay}ms`
      );
      await sleep(delay);
    } catch (err) {
      // timeout (AbortError) ou erro de rede — trata como retry também
      lastError = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      console.warn(
        `[v0] PNCP ${isAbort ? "timeout" : "erro"} (${url}) - tentativa ${attempt + 1}/${MAX_RETRIES + 1}`
      );

      if (attempt === MAX_RETRIES) break;

      const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
      await sleep(delay);
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError ?? new Error(`fetchPncp: falha ao buscar ${url} sem resposta`);
}