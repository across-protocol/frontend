import GenericRewardsProgram from "./GenericRewardsProgram/GenericRewardsProgram";
import { BigNumber } from "ethers";

const OPRebatesProgram = () => {
  return (
    <GenericRewardsProgram
      program="referrals"
      metaCard={[]}
      claimCard={{
        totalRewards: BigNumber.from(0),
        availableRewards: BigNumber.from(0),
      }}
      programName="OP Rewards Program"
    />
  );
};

export default OPRebatesProgram;
