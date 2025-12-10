import { useMemo } from "react";
import useCurrentBreakpoint from "./useCurrentBreakpoint";
import { twitterShareContestActive } from "utils";

const contestActiveParams = {
  cardTitle: "Win 1,000 ACX!",
  cardSubtitle:
    "Post your transaction speed on X for a chance to win this week's 1,000 ACX giveaway. Powered by Intents.",
  modalTitle: "Share for a Chance to Win 1,000 ACX!",
};

const contestInactiveParams = {
  cardTitle: "Share your move.",
  cardSubtitle:
    "You get places fast, don't let your friends miss out!",
  modalTitle: "Too Fast Not to Share",
};

const tweetText =
  "Check out how fast I just bridged with @AcrossProtocol.\n\nPowered by Intents. ⛺";

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
      stepTitle: "Grab your speed snapshot",
      stepDescription: "Copy the image on the left (or take a screenshot).",
      buttonText: isLaptopAndUp ? "COPY TO CLIPBOARD" : "DOWNLOAD IMAGE",
      showCopyButton: isLaptopAndUp,
      showDownloadButton: !isLaptopAndUp,
    };
  }, [isLaptopAndUp]);

  const shareConfig = useMemo(() => {
    return {
      stepDescription: [
        "Paste the image, tag @AcrossProtocol, and post.",
        "That’s it!",
      ],
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
