import { BigNumber } from "ethers";
import { StakingPool } from "hooks/useStakingPool";
import { StakingActionFunctionType } from "./hooks/useStakingAction";

type GenericStakingComponentProps = {
  isConnected: boolean;
  walletConnectionHandler: () => void;
};

export type StakingRewardPropType = GenericStakingComponentProps & {
  maximumClaimableAmount: BigNumber;
  usersMultiplierPercentage: number;
};

export type StakingFormPropType = GenericStakingComponentProps & {
  logoURI: string;
  stakeActionFn: StakingActionFunctionType;
  unstakeActionFn: StakingActionFunctionType;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
  poolData: StakingPool;
};
