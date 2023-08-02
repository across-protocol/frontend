import { StakingPool } from "utils/staking-pool";
import { StakingActionFunctionType } from "./hooks/useStakingAction";

type GenericStakingComponentProps = {
  isConnected: boolean;
  poolData: StakingPool;
};

export type StakingRewardPropType = GenericStakingComponentProps & {
  claimActionHandler: () => Promise<void>;
  isMutating: boolean;
};

export type StakingFormPropType = GenericStakingComponentProps & {
  logoURI: string;
  logoURIs?: [string, string];
  stakeActionFn: StakingActionFunctionType;
  unstakeActionFn: StakingActionFunctionType;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
};
