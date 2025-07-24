import { TypedVercelRequest } from "./_types";

export function getRequestId(req: TypedVercelRequest<unknown, unknown>) {
  const requestIdFromHeader = req.headers["x-request-id"];
  const fallbackRequestId = crypto.randomUUID();

  if (!requestIdFromHeader || typeof requestIdFromHeader !== "string") {
    return fallbackRequestId;
  }

  return requestIdFromHeader;
}
