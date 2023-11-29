import GenericRewardsProgram from "./GenericRewardsProgram/GenericRewardsProgram";
import { useOPRebatesProgram } from "./hooks/useOPRebatesProgram";

const OPRebatesProgram = () => {
  const { labels, rewardsAmount, claimableAmount } = useOPRebatesProgram();
  return (
    <GenericRewardsProgram
      program="op-rebates"
      metaCard={labels}
      claimCard={{
        totalRewards: rewardsAmount,
        availableRewards: claimableAmount,
      }}
      programName="OP Rewards Program"
    />
  );
};

export default OPRebatesProgram;
