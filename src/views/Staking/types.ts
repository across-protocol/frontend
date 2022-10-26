import { BigNumberish } from "ethers";
import { FormatterFnType, ParserFnType } from "hooks/useStakingPool";
import { StakingActionFunctionType } from "./hooks/useStakingAction";

type GenericStakingComponentProps = {
  isConnected: boolean;
  walletConnectionHandler: () => void;
};

export type StakingRewardPropType = GenericStakingComponentProps & {
  maximumClaimableAmount: BigNumberish;
  usersMultiplierPercentage: number;
};

export type StakingFormPropType = GenericStakingComponentProps & {
  lpTokenName: string;
  userCumulativeStake: BigNumberish;
  globalCumulativeStake: BigNumberish;
  ageOfCapital: number;
  usersMultiplierPercentage: number;
  currentMultiplier: BigNumberish;
  usersTotalLPTokens: BigNumberish;
  availableLPTokenBalance: BigNumberish;
  shareOfPool: BigNumberish;
  isWrongNetwork: boolean;
  estimatedPoolApy: BigNumberish;
  lpTokenFormatter: FormatterFnType;
  lpTokenParser: ParserFnType;
  stakeActionFn: StakingActionFunctionType;
  unstakeActionFn: StakingActionFunctionType;
  isDataLoading: boolean;
  isMutating: boolean;
  logoURI: string;
};
