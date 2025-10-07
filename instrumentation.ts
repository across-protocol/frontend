import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { trace, context } from "@opentelemetry/api";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";

// Resource configuration with semantic conventions
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "app-frontend-v3",
  [ATTR_SERVICE_VERSION]: process.env.VERCEL_DEPLOYMENT_ID || "unknown",
  version: process.env.VERCEL_DEPLOYMENT_ID || "unknown",
  env: process.env.VERCEL_ENV || "preview",
  "vercel.region": process.env.VERCEL_REGION,
  "vercel.sha": process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
  "vercel.host": process.env.VERCEL_URL || "unknown",
  "vercel.branch_host": process.env.VERCEL_BRANCH_URL || "unknown",
  "vercel.deployment_id": process.env.VERCEL_DEPLOYMENT_ID || "unknown",
});

const processor = new BatchSpanProcessor(new OTLPTraceExporter(), {
  scheduledDelayMillis: 500,
});

const httpInstrumentation = new HttpInstrumentation({
  disableIncomingRequestInstrumentation: true,
});

const sdk = new NodeSDK({
  resource,
  spanProcessors: [processor],
  instrumentations: [httpInstrumentation],
});

if (
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_ENV === "preview"
) {
  sdk.start();
  console.log(
    `OpenTelemetry SDK started for Vercel env: ${process.env.VERCEL_ENV}`
  );
}
export const tracer = trace.getTracer("across-api");
export { context, processor, httpInstrumentation };
