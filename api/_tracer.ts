import { trace } from "@opentelemetry/api";

import { serviceName } from "../instrumentation";

export function getTracer() {
  return trace.getTracer(serviceName);
}
