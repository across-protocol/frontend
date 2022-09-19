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
  _address: string,
  _userName?: string,
  _password?: string
): Promise<Rewards> {
  let cr: string | undefined;
  if (_userName && _password) {
    cr = ethers.BigNumber.from("15").toString();
  }
  return {
    welcomeTravellerRewards: ethers.BigNumber.from("1").toString(),
    earlyUserRewards: ethers.BigNumber.from("2").toString(),
    liquidityProviderRewards: ethers.BigNumber.from("5").toString(),
    communityRewards: cr,
  };
}
