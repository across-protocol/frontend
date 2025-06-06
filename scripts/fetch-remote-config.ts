import chalk from "chalk";
import { writeFileSync } from "fs";
import dotenv from "dotenv";

import {
  fetchRpcProviderConfigs,
  fetchExclusiveRelayerConfigs,
  fetchFillTimes,
  fetchExclusivityFillTimes,
  fetchExclusiveRelayersDynamicWeights,
  fetchExclusiveRelayersFixedWeights,
  fetchExclusivityConfig,
  getRemoteConfigCommitHash,
  getBqReaderRemoteBaseUrl,
  remoteConfigTypes,
  getAcrossConfigsRemoteBaseUrl,
  getRelayerConfigsRemoteBaseUrl,
} from "./remote-configs/utils";

dotenv.config({
  path: [".env.local", ".env"],
});

const remoteConfigs = {
  [remoteConfigTypes.RPC_PROVIDERS]: {
    fetchFn: () =>
      fetchRpcProviderConfigs(
        getAcrossConfigsRemoteBaseUrl(),
        "packages/quotes-api-config/config.json",
        getRemoteConfigCommitHash(remoteConfigTypes.RPC_PROVIDERS)
      ),
    localFilePath: "src/data/rpc-providers.json",
  },
  [remoteConfigTypes.FILL_TIMES]: {
    fetchFn: () =>
      fetchFillTimes(
        getBqReaderRemoteBaseUrl(),
        "fill-times.json",
        getRemoteConfigCommitHash(remoteConfigTypes.FILL_TIMES)
      ),
    localFilePath: "src/data/fill-times-preset.json",
  },
  [remoteConfigTypes.EXCLUSIVITY_FILL_TIMES]: {
    fetchFn: () =>
      fetchExclusivityFillTimes(
        getBqReaderRemoteBaseUrl(),
        "relayer-exclusivity/fill-times.json",
        getRemoteConfigCommitHash(remoteConfigTypes.EXCLUSIVITY_FILL_TIMES)
      ),
    localFilePath: "src/data/exclusivity-fill-times.json",
  },
  [remoteConfigTypes.EXCLUSIVE_RELAYERS]: {
    fetchFn: () =>
      fetchExclusiveRelayerConfigs(
        getRelayerConfigsRemoteBaseUrl(),
        "build/exclusive-relayer-configs.json",
        getRemoteConfigCommitHash(remoteConfigTypes.EXCLUSIVE_RELAYERS)
      ),
    localFilePath: "src/data/exclusive-relayer-configs.json",
  },
  [remoteConfigTypes.EXCLUSIVE_RELAYERS_DYNAMIC_WEIGHTS]: {
    fetchFn: async () => {
      const [dynamicWeights, fixedWeights] = await Promise.all([
        fetchExclusiveRelayersDynamicWeights(
          getBqReaderRemoteBaseUrl(),
          "relayer-exclusivity/strategies/weighted-random/dynamic-weights.json",
          getRemoteConfigCommitHash(
            remoteConfigTypes.EXCLUSIVE_RELAYERS_DYNAMIC_WEIGHTS
          )
        ),
        fetchExclusiveRelayersFixedWeights(
          getBqReaderRemoteBaseUrl(),
          "relayer-exclusivity/strategies/weighted-random/fixed-weights.json",
          getRemoteConfigCommitHash(
            remoteConfigTypes.EXCLUSIVE_RELAYERS_FIXED_WEIGHTS
          )
        ),
      ]);
      const relayerAddresses = new Set([
        ...Object.keys(dynamicWeights),
        ...Object.keys(fixedWeights),
      ]);
      const relayerAddressesArray = Array.from(relayerAddresses);
      const mergedWeights = relayerAddressesArray.reduce(
        (acc, relayerAddress) => {
          const dynamicWeight = dynamicWeights[relayerAddress] ?? 0;
          const fixedWeight = fixedWeights[relayerAddress] ?? 0;

          if (dynamicWeight > 0 || fixedWeight > 0) {
            acc[relayerAddress] = {
              dynamicWeight,
              fixedWeight,
            };
          }

          return acc;
        },
        {}
      );
      return mergedWeights;
    },
    localFilePath: "src/data/exclusive-relayer-weights.json",
  },
  [remoteConfigTypes.EXCLUSIVITY_STRATEGY]: {
    fetchFn: () =>
      fetchExclusivityConfig(
        // Using invalid URL will cause the fetch to fail and fallback to the local file for now.
        getAcrossConfigsRemoteBaseUrl(),
        "packages/exclusive-relayer-strategy-config/config.json",
        getRemoteConfigCommitHash(remoteConfigTypes.EXCLUSIVITY_STRATEGY)
      ),
    localFilePath: "src/data/exclusivity-strategy.json",
  },
};

(async () => {
  console.log("Running pre-build script to fetch remote config files...");

  try {
    for (const [configType, { fetchFn, localFilePath }] of Object.entries(
      remoteConfigs
    )) {
      console.log(chalk.cyan(`Fetching ${configType} config...`));
      const config = await fetchFn();
      writeFileSync(localFilePath, JSON.stringify(config, null, 2));
    }
    console.log(chalk.green("Successfully fetched remote config files"));
  } catch (e) {
    console.error(chalk.bgRed("ERROR"));
    console.error(
      chalk.red(
        e instanceof Error ? e.message : "Error fetching remove config file"
      )
    );
    process.exit(1);
  }
})();
