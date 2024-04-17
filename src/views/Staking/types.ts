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

export type StakingPoolTokenPairLogoURIs = [string, string];

export type StakingFormPropType = GenericStakingComponentProps & {
  logoURI: string;
  logoURIs?: StakingPoolTokenPairLogoURIs;
  stakeActionFn: StakingActionFunctionType;
  unstakeActionFn: StakingActionFunctionType;
  isDataLoading: boolean;
  isMutating: boolean;
  isWrongNetwork: boolean;
  tokenSymbol: string;
};
