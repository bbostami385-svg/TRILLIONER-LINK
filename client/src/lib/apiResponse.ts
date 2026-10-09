const API_UNAVAILABLE_MESSAGE = "TRILLIONER LINK backend API is unavailable. Redeploy the latest Vercel build with the API bridge, or configure VITE_API_URL to your deployed Render server.";

function looksLikeHtml(body: string) {
  const normalized = body.trimStart().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html") || normalized.startsWith("<head") || normalized.startsWith("<body");
}

/**
 * Validate an API response without consuming the response that tRPC will parse.
 * The clone is read once; the original response body remains available to the caller.
 */
export async function validateApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const preview = await response.clone().text();
  const trimmed = preview.trim();

  if (looksLikeHtml(preview)) throw new Error(API_UNAVAILABLE_MESSAGE);
  if (!trimmed) throw new Error(`TRILLIONER LINK API returned an empty response (HTTP ${response.status}).`);

  try {
    JSON.parse(trimmed);
  } catch {
    const format = contentType || "unknown content type";
    throw new Error(`TRILLIONER LINK API returned a non-JSON response (HTTP ${response.status}, ${format}).`);
  }

  return response;
}

export { API_UNAVAILABLE_MESSAGE };
