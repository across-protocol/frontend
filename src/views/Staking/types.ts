import { BigNumberish } from "ethers";
import { Theme } from "@emotion/react";
import { StyledComponent } from "@emotion/styled";
import {
  FormatterFnType,
  ParserFnType,
  StakingActionFunctionType,
} from "./hooks/useStakingActionsResolver";

export type StylizedSVG = StyledComponent<
  React.SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  } & {
    children?: React.ReactNode;
  } & {
    theme?: Theme | undefined;
  },
  {},
  {}
>;

type GenericStakingComponentProps = {
  isConnected: boolean;
  walletConnectionHandler: () => void;
};

export type StakingRewardPropType = GenericStakingComponentProps & {
  maximumClaimableAmount: BigNumberish;
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
};
