import { ethers } from "ethers";
/**
 * Creates a mocked variant of the rewards API Call
 * @param _amount The amount of fees to calculate
 * @header (optional) HTTP header - Authorization: Bearer <JWT_TOKEN>
 * @returns The result of the HTTP call to `api/suggested-fees`
 */

interface Rewards {
  welcomeTravellerRewards: string;
  earlyUserRewards: string;
  liquidityProviderRewards: string;
  communityRewards?: string;
}

export default async function prelaunchRewardsMockedCall(
  _address: string
): Promise<Rewards> {
  return {
    welcomeTravellerRewards: ethers.BigNumber.from("1").toString(),
    earlyUserRewards: ethers.BigNumber.from("2").toString(),
    liquidityProviderRewards: ethers.BigNumber.from("5").toString(),
    communityRewards: undefined,
  };
}
