import { BigNumber } from "ethers";
import { TokenInfo } from "utils";

type GenericRewardsProgramProps = {
  programName: string;
  rewardToken: TokenInfo;
  claimCard: {
    logoURI: string;
    totalRewards: BigNumber;
    availableRewards: BigNumber;
    claimHandler: () => void;
    children?: React.ReactNode;
  };
  metaCard: {
    title: string;
    tooltip?: string;
    value: string;
    suffix?: React.ReactNode;
  }[];
  transferFilter: () => boolean;
};
