import { buildSearchParams, resolveWebsiteUrl } from "utils";

// https://developer.x.com/en/docs/x-for-websites/tweet-button/guides/web-intent
export function buildTwitterShareUrl(params: {
  time: number;
  originChainId: number;
  destinationChainId: number;
}): string {
  const hashTags: string[] = ["PoweredByIntents ⛺"]; // tags without "#"
  const relatedAccounts = ["@AcrossProtocol"];
  const imageUrl = `${resolveWebsiteUrl()}/api/twitter-share?${buildSearchParams(
    {
      s: params.time,
      from: params.originChainId,
      to: params.destinationChainId,
    }
  )}`;
  const tweetText = `Bridged in seconds with @AcrossProtocol\nGo crosschain at ${imageUrl}\n\n`;
  const twitterUrl = `https://twitter.com/intent/tweet?${buildSearchParams({
    text: tweetText,
    hashtags: hashTags.join(","),
    related: relatedAccounts.join(","),
  })}`;

  return twitterUrl;
}
