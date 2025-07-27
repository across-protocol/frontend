import { Span } from "@opentelemetry/api";
import { ATTR_HTTP_REQUEST_METHOD } from "@opentelemetry/semantic-conventions";

import { TypedVercelRequest } from "./_types";

export function getRequestId(req: TypedVercelRequest<unknown, unknown>) {
  const requestIdFromHeader = req.headers?.["x-vercel-id"];
  const fallbackRequestId = crypto.randomUUID();

  if (!requestIdFromHeader || typeof requestIdFromHeader !== "string") {
    return fallbackRequestId;
  }

  // Request ID header from Vercel is prefixed with the region the request hit and the
  // regions where the serverless function executes. We only want the last part of the
  // request ID. See https://vercel.com/docs/headers/request-headers#x-vercel-id
  const cleanedRequestIdFromHeader = requestIdFromHeader.split(":").at(-1);
  return cleanedRequestIdFromHeader ?? fallbackRequestId;
}

export function setRequestSpanAttributes(
  request: TypedVercelRequest<unknown, unknown>,
  span: Span,
  requestId?: string
) {
  const requestIdToUse = requestId ?? getRequestId(request);
  span.setAttribute("http.request_id", requestIdToUse);
  span.setAttribute(ATTR_HTTP_REQUEST_METHOD, request.method ?? "unknown");
}
