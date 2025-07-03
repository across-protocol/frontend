import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { trace, context } from "@opentelemetry/api";

// Resource configuration with semantic conventions
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "app-frontend-v3",
  [ATTR_SERVICE_VERSION]: process.env.REACT_APP_GIT_COMMIT_HASH || "unknown",
  "deployment.environment":
    process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
});

// sdk
const sdk = new NodeSDK({
  resource,
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
    new SimpleSpanProcessor(new OTLPTraceExporter()),
  ],
});

sdk.start();

export const tracer = trace.getTracer("across-api");
export { context };
