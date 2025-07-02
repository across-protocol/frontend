import { registerOTel, SpanProcessorOrName } from "@vercel/otel";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Resource configuration with semantic conventions
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "app-frontend-v3",
  [ATTR_SERVICE_VERSION]: process.env.REACT_APP_GIT_COMMIT_HASH || "unknown",
  "deployment.environment":
    process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
});

// Configure exporters based on environment
const spanProcessors: SpanProcessor[] = [];

// Add console exporter for development
if (isDevelopment) {
  spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
}

// Add Datadog OTLP exporter for production
if (isProduction && process.env.DD_API_KEY) {
  const datadogExporter = new OTLPTraceExporter({
    url: `https://otlp.${process.env.DD_SITE || "datadoghq.com"}/v1/traces`,
    headers: {
      "DD-API-KEY": process.env.DD_API_KEY,
    },
  });
  spanProcessors.push(new SimpleSpanProcessor(datadogExporter));
}

// sdk
const sdk = new NodeSDK({
  resource,
  spanProcessors,
});

sdk.start();

// registerOTel({
//   serviceName: "app-frontend-v3",
//   instrumentations
//   spanProcessors,
// });
