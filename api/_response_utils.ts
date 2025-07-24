import { VercelResponse } from "@vercel/node";

/**
 * Performs the needed function calls to return a Vercel Response
 * @param params.response The response client provided by Vercel
 * @param params.body A payload in JSON format to send to the client
 * @param params.statusCode The status code - defaults to 200
 * @param params.cacheSeconds The cache time in non-negative whole seconds
 * @param params.staleWhileRevalidateSeconds The stale while revalidate time in non-negative whole seconds
 * @param params.requestId The request ID to set in the response body
 * @returns The response object
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 * @see https://datatracker.ietf.org/doc/html/rfc7234
 * @note Be careful to not set anything negative please. The comment in the fn explains why
 */
export function sendResponse(params: {
  response: VercelResponse;
  body: unknown;
  statusCode: number;
  cacheSeconds?: number;
  staleWhileRevalidateSeconds?: number;
  requestId?: string;
}) {
  const {
    response,
    body,
    statusCode,
    cacheSeconds,
    staleWhileRevalidateSeconds,
    requestId,
  } = params;

  const cacheControlHeaders = [];

  if (cacheSeconds) {
    cacheControlHeaders.push(`s-maxage=${cacheSeconds}`);
  }

  if (staleWhileRevalidateSeconds) {
    cacheControlHeaders.push(
      `stale-while-revalidate=${staleWhileRevalidateSeconds}`
    );
  }

  if (cacheControlHeaders.length > 0) {
    response.setHeader("Cache-Control", cacheControlHeaders.join(", "));
  }

  if (requestId) {
    (body as Record<string, unknown>).id = requestId;
  }

  return response.status(statusCode).json(body);
}
