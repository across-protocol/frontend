import { useMemo } from "react";
import useCurrentBreakpoint from "./useCurrentBreakpoint";
import { twitterShareContestActive } from "utils";

const contestActiveParams = {
  cardTitle: "Win 1,000 ACX!",
  cardSubtitle:
    "Post your transaction speed on X for a chance to win this week's 1,000 ACX giveaway #PoweredByIntents",
  modalTitle: "Share for a Chance to Win 1,000 ACX!",
};

const contestInactiveParams = {
  cardTitle: "Wow, that was fast!",
  cardSubtitle:
    "Flex your transaction speed on X and show your friends how fast they can bridge with Across! #PoweredByIntents",
  modalTitle: "Flex Your Speed",
};

const tweetText =
  "Check out how fast I just bridged with @AcrossProtocol\n #PoweredByIntents ⛺";

export function useTwitter() {
  const { helpers } = useCurrentBreakpoint();
  const isLaptopAndUp = !helpers.tabletAndDown;

  const twitterParams = useMemo(() => {
    return twitterShareContestActive
      ? contestActiveParams
      : contestInactiveParams;
  }, []);

  const copyConfig = useMemo(() => {
    return {
      stepTitle: isLaptopAndUp ? "Copy image to clipboard" : "Download image",
      stepDescription: isLaptopAndUp
        ? "Copy your Across flex image to clipboard."
        : "Download your Across flex image to your device.",
      buttonText: isLaptopAndUp ? "COPY TO CLIPBOARD" : "DOWNLOAD IMAGE",
      showCopyButton: isLaptopAndUp,
      showDownloadButton: !isLaptopAndUp,
    };
  }, [isLaptopAndUp]);

  const shareConfig = useMemo(() => {
    return {
      stepDescription: isLaptopAndUp
        ? "Just paste (Ctrl+V / ⌘+V) before posting!"
        : "Just upload your image before posting!",
      twitterUrl: isLaptopAndUp
        ? "https://twitter.com/intent/tweet"
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
    };
  }, [isLaptopAndUp]);

  return {
    twitterParams,
    copyConfig,
    shareConfig,
    tweetText,
    isLaptopAndUp,
  };
}
