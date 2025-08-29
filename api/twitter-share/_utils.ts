import { getChainInfo } from "../_utils";
import path from "path";
import fs from "fs";

const assetsDir = path.join(__dirname, "assets");

export function getChainLogoPath(chainId: number): string | undefined {
  try {
    const chainName = getChainInfo(chainId)
      .name.toLowerCase()
      .replaceAll(" ", "-");
    const logoPath = path.join(assetsDir, "chain-logos", `${chainName}.png`);

    if (!fs.existsSync(logoPath)) {
      throw new Error(`No chain logo found at path ${logoPath}`);
    }

    return logoPath;
  } catch (e) {
    console.warn(`Unable to find logo for chainId ${chainId}.`, {
      cause: e,
      chainId,
    });
    return undefined;
  }
}
