import { trace } from "@opentelemetry/api";

import { serviceName } from "../instrumentation.cjs";

export function getTracer() {
  return trace.getTracer(serviceName);
}
