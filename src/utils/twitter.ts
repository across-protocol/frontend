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

export const twitterParams = twitterShareContestActive
  ? contestActiveParams
  : contestInactiveParams;
