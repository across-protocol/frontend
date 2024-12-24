import { Client } from "@upstash/qstash";

import { RelayRequest, RelayStrategy, RelayStrategyName } from "./_types";
import { resolveVercelEndpoint } from "../_utils";

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function pushRelayRequestToQueue({
  request,
  strategy,
  requestId,
}: {
  request: RelayRequest;
  strategy: RelayStrategy;
  requestId: string;
}) {
  const strategyName = strategy.strategyName;
  const queue = getRelayRequestQueue(strategyName, request.chainId);
  await queue.upsert({
    parallelism: strategy.queueParallelism,
  });

  const baseUrl = resolveVercelEndpoint(true);
  const response = await queue.enqueueJSON({
    url: `${baseUrl}/api/relay/jobs/process`,
    // callbackUrl: `${baseUrl}/api/relay/jobs/success`,
    // failureCallbackUrl: `${baseUrl}/api/relay/jobs/failure`,
    body: {
      requestId,
      request,
      strategyName,
    },
  });
  return response;
}

function getRelayRequestQueue(
  strategyName: RelayStrategyName,
  chainId: number
) {
  return client.queue({
    queueName: `relay-request-queue-${chainId}-${strategyName}`,
  });
}
