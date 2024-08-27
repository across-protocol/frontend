import chalk from "chalk";
import { writeFileSync } from "fs";
import dotenv from "dotenv";

import {
  fetchRpcProviderConfigs,
  fetchExclusiveRelayerConfigs,
  fetchFillTimes,
  fetchExclusiveRelayersDynamicWeights,
  fetchExclusiveRelayersFixedWeights,
  getRemoteConfigCommitHash,
  getBqReaderRemoteBaseUrl,
  remoteConfigTypes,
  getAcrossConfigsRemoteBaseUrl,
  getRelayerConfigsRemoteBaseUrl,
} from "./remote-configs/utils";

dotenv.config({
  path: [".env.local", ".env.production", ".env"],
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
      const mergedWeights = Object.entries(dynamicWeights).reduce(
        (acc, [relayerAddress, dynamicWeight]) => {
          const fixedWeight = fixedWeights[relayerAddress] ?? 1;
          acc[relayerAddress] = {
            dynamicWeight,
            fixedWeight,
          };
          return acc;
        },
        {}
      );
      return mergedWeights;
    },
    localFilePath: "src/data/exclusive-relayer-weights.json",
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
