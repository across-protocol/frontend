import { buildSearchParams, getChainInfo, resolveWebsiteUrl } from "utils";

// https://developer.x.com/en/docs/x-for-websites/tweet-button/guides/web-intent
export function buildTwitterShareUrl(params: {
  time: number;
  originChainId: number;
  destinationChainId: number;
}): string {
  const originChainName = getChainInfo(params.originChainId).name;
  const destinationChainName = getChainInfo(params.destinationChainId).name;
  const hashTags = ["PoweredByIntents"]; // tags without "#"
  const relatedAccounts = ["@AcrossProtocol"];
  const tweetText = `I just used @AcrossProtocol to bridge from ${originChainName} to ${destinationChainName} in ${params.time} seconds!\n\nTry it yourself app.across.to`; // TODO: get copy
  const imageUrl = `${resolveWebsiteUrl()}/api/twitter-share?${buildSearchParams(
    {
      seconds: params.time,
      originChainId: params.originChainId,
      destinationChainId: params.destinationChainId,
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
