import { buildSearchParams, resolveWebsiteUrl } from "utils";

// https://developer.x.com/en/docs/x-for-websites/tweet-button/guides/web-intent
export function buildTwitterShareUrl(params: {
  time: number;
  originChainId: number;
  destinationChainId: number;
}): string {
  const hashTags: string[] = []; // tags without "#"
  const relatedAccounts = ["@AcrossProtocol"];
  const tweetText = `Bridged in seconds with @acrossprotocol\nGo crosschain at ${resolveWebsiteUrl()}\n#PoweredByIntents ⛺`;
  const imageUrl = `${resolveWebsiteUrl()}/api/twitter-share?${buildSearchParams(
    {
      s: params.time,
      from: params.originChainId,
      to: params.destinationChainId,
    }
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?${buildSearchParams({
    text: tweetText,
    hashtags: hashTags.join(","),
    url: imageUrl,
    related: relatedAccounts.join(","),
  })}`;

  return twitterUrl;
}
