import { trace } from "@opentelemetry/api";

export function getTracer() {
  return trace.getTracer("app.across.to");
}
