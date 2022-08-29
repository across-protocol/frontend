type GenericStakingComponentProps = {
  isConnected: boolean;
  walletConnectionHandler: () => void;
};

export type StakingRewardPropType = GenericStakingComponentProps & {
  maximumClaimableAmount: number;
};

export type StakingFormPropType = GenericStakingComponentProps & {};
