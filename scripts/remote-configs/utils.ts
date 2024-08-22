import {
  array,
  assert,
  Struct,
  Infer,
  number,
  record,
  string,
  type,
} from "superstruct";

// Fallback data for remote configs in private repos or local development
import fillTimesFallbackData from "../../src/data/examples/fill-times.json";
import dynamicWeightsFallbackData from "../../src/data/examples/dynamic-weights.json";
import fixedWeightsFallbackData from "../../src/data/examples/fixed-weights.json";

export const remoteConfigTypes = {
  FILL_TIMES: "FILL_TIMES",
  EXCLUSIVE_RELAYERS: "EXCLUSIVE_RELAYERS",
  EXCLUSIVE_RELAYERS_DYNAMIC_WEIGHTS: "EXCLUSIVE_RELAYERS_DYNAMIC_WEIGHTS",
  EXCLUSIVE_RELAYERS_FIXED_WEIGHTS: "EXCLUSIVE_RELAYER_WEIGHTS",
} as const;

export type RemoteConfig =
  (typeof remoteConfigTypes)[keyof typeof remoteConfigTypes];

export const fetchFillTimes = makeFetchRemoteConfig(
  array(
    type({
      destination_route_classification: string(),
      max_size_usd: string(),
      origin_route_classification: string(),
      p75_fill_time_secs: string(),
      token_liquidity_groups: string(),
    })
  ),
  fillTimesFallbackData
);

export const fetchExclusiveRelayerConfigs = makeFetchRemoteConfig(
  record(
    string(),
    type({
      minExclusivePeriod: number(),
      minProfitThreshold: number(),
      balanceMultiplier: number(),
      maxFillSize: number(),
    })
  )
);

export const fetchExclusiveRelayersDynamicWeights = makeFetchRemoteConfig(
  record(string(), number()),
  dynamicWeightsFallbackData
);

export const fetchExclusiveRelayersFixedWeights = makeFetchRemoteConfig(
  record(string(), number()),
  fixedWeightsFallbackData
);

function makeFetchRemoteConfig<T>(schema: Struct<T>, fallbackData?: T) {
  return async (
    remoteBaseUrl: string | undefined,
    remoteConfigFilePath: string,
    commitHash = "master"
  ) =>
    fetchRemoteConfigAndValidate<T>(
      remoteBaseUrl,
      remoteConfigFilePath,
      schema,
      commitHash,
      fallbackData
    );
}

async function fetchRemoteConfigAndValidate<T>(
  remoteBaseUrl: string | undefined,
  remoteConfigFilePath: string,
  schema: Struct<T>,
  commitHash = "master",
  fallbackData?: T
) {
  let data: T;

  // If the remote base is not provided, we will use the fallback data.
  // This is the case for private repos that require a GitHub token and for local development.
  if (remoteBaseUrl === undefined && fallbackData !== undefined) {
    data = fallbackData;
  } else {
    const url = `${remoteBaseUrl}/${commitHash}/${remoteConfigFilePath}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch file from ${url}, with error code %${res.status}`
      );
    }
    data = await res.json();
  }

  assert(data, schema);

  return data as Infer<typeof schema>;
}

export function getRemoteConfigCommitHash(config: RemoteConfig) {
  return process.env[`REMOTE_CONFIG_COMMIT_HASH_${config}`] ?? "master";
}

export function getBqReaderRemoteBaseUrl() {
  const GH_TOKEN = process.env.GH_TOKEN;
  return GH_TOKEN !== undefined
    ? `https://${GH_TOKEN}@raw.githubusercontent.com/UMAprotocol/across-bq-reader`
    : undefined;
}
