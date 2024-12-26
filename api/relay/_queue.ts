import { Client } from "@upstash/qstash";

import { RelayRequest, RelayStrategy, RelayStrategyName } from "./_types";
import { resolveVercelEndpoint } from "../_utils";

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function pushRelayRequestToQueue({
  request,
  strategy,
}: {
  request: RelayRequest;
  strategy: RelayStrategy;
}) {
  const strategyName = strategy.strategyName;
  const queue = getRelayRequestQueue(strategyName, request.chainId);
  await queue.upsert({
    parallelism: strategy.queueParallelism,
  });

  const baseUrl = resolveVercelEndpoint(true);
  const response = await queue.enqueueJSON({
    retries: 3,
    contentBasedDeduplication: true,
    headers: new Headers({
      "Retry-After": "1",
    }),
    url: `${baseUrl}/api/relay/jobs/process`,
    body: {
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
