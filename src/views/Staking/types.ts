import { BigNumberish } from "ethers";
import { Theme } from "@emotion/react";
import { StyledComponent } from "@emotion/styled";

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
  ageOfCapital: BigNumberish;
  maxMultiplier: BigNumberish;
  currentMultiplier: BigNumberish;
};
