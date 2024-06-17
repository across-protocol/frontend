import GenericRewardsProgram from "./GenericRewardsProgram/GenericRewardsProgram";
import { useARBRebatesProgram } from "./hooks/useARBRebatesProgram";

const OPRebatesProgram = () => {
  const { labels, rewardsAmount, claimableAmount } = useARBRebatesProgram();
  return (
    <GenericRewardsProgram
      program="arb-rebates"
      metaCard={labels}
      claimCard={{
        totalRewards: rewardsAmount,
        availableRewards: claimableAmount,
      }}
      programName="ARB Rewards Program"
    />
  );
};

export default OPRebatesProgram;
