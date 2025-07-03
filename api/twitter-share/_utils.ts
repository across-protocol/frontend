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

/**
 * Detects if the request is from a social media bot/crawler
 * @param userAgent The User-Agent header from the request
 * @returns true if the request is from a social media bot
 */
export function isSocialMediaBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;

  const botPatterns = [
    // Twitter/X bots
    /Twitter.*Bot/i,
    /X.*Bot/i,

    // Facebook/Meta bots
    /facebookexternalhit/i,
    /Facebot/i,
    /facebook/i,

    // LinkedIn bots
    /LinkedIn.*Bot/i,

    // Discord bots
    /Discord.*Bot/i,

    // Telegram bots
    /Telegram.*Bot/i,

    // General social media crawlers
    /WhatsApp/i,
    /Slack.*Bot/i,

    // Generic bot patterns that might be used by social platforms
    /bot.*social/i,
    /social.*bot/i,
    /crawler.*social/i,
    /social.*crawler/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}
