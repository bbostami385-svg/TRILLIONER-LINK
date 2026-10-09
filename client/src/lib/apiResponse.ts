const API_UNAVAILABLE_MESSAGE = "TRILLIONER LINK backend API is unavailable. Redeploy the latest Vercel build with the API bridge, or configure VITE_API_URL to your deployed Render server.";

function looksLikeHtml(body: string) {
  const normalized = body.trimStart().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html") || normalized.startsWith("<head") || normalized.startsWith("<body");
}

/**
 * Read the network Response exactly once and return a fresh Response for tRPC.
 * The original stream is never handed to a second body reader.
 */
export async function validateApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  const trimmed = body.trim();

  if (looksLikeHtml(body)) throw new Error(API_UNAVAILABLE_MESSAGE);
  if (!trimmed) throw new Error(`TRILLIONER LINK API returned an empty response (HTTP ${response.status}).`);

  try {
    JSON.parse(trimmed);
  } catch {
    const format = contentType || "unknown content type";
    throw new Error(`TRILLIONER LINK API returned a non-JSON response (HTTP ${response.status}, ${format}).`);
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export { API_UNAVAILABLE_MESSAGE };
