import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import * as prettier from "prettier";

async function generateChainConfig(chainName: string) {
  const indexFileContent = `
    import { CHAIN_IDs, PUBLIC_NETWORKS } from "@across-protocol/constants";
    import { utils as sdkUtils } from "@across-protocol/sdk";
    import { ChainConfig } from "../types";

    const { getDeployedAddress } = sdkUtils;

    const chainId = CHAIN_IDs.${chainName.replace("-", "_").toUpperCase()};
    const chainInfoBase = PUBLIC_NETWORKS[chainId];

    export default {
      ...chainInfoBase,
      logoPath: "./assets/logo.svg",
      grayscaleLogoPath: "./assets/grayscale-logo.svg",
      spokePool: getDeployedAddress("SpokePool", chainId),
      chainId,
      publicRpcUrl: TODO,
      blockTimeSeconds: 15,
      tokens: [],
      enableCCTP: false,
    } as ChainConfig;
  `;

  const chainConfigsTargetDir =
    process.cwd() + "/scripts/chain-configs/" + chainName.toLowerCase();

  if (!existsSync(chainConfigsTargetDir)) {
    mkdirSync(chainConfigsTargetDir);
  }

  if (!existsSync(chainConfigsTargetDir + "/assets")) {
    mkdirSync(chainConfigsTargetDir + "/assets");
  }

  writeFileSync(
    chainConfigsTargetDir + "/index.ts",
    await prettier.format(indexFileContent, { parser: "typescript" })
  );

  // write ./chain-configs/index.ts file
  const chainConfigDirContents = readdirSync(
    process.cwd() + "/scripts/chain-configs"
  );
  const chainConfigDirNames: string[] = [];
  for (const chainConfigDirContent of chainConfigDirContents) {
    if (
      chainConfigDirContent.endsWith(".ts") ||
      chainConfigDirContent.startsWith(".") // ignore dotfiles like .DS_Store on mac
    ) {
      continue;
    }
    chainConfigDirNames.push(chainConfigDirContent);
  }

  const chainConfigsIndexFileContent = chainConfigDirNames
    .map((chainConfigDirName) => {
      return `export {default as ${chainConfigDirName.replace("-", "_").toUpperCase()}} from "./${chainConfigDirName}";`;
    })
    .join("\n");
  writeFileSync(
    process.cwd() + "/scripts/chain-configs/index.ts",
    await prettier.format(chainConfigsIndexFileContent, {
      parser: "typescript",
    })
  );

  console.log(
    `Chain config for ${chainName} generated in ${chainConfigsTargetDir}`
  );
}

generateChainConfig(process.argv[2]);
