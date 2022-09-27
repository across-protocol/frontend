import axios from "axios";
import { RewardsApiInterface } from "../types";
import { rewardsApiUrl } from "utils";

export default async function rewardsApiCall(
  address: string,
  jwt?: string
): Promise<RewardsApiInterface> {
  try {
    const response = await axios.get(
      `${rewardsApiUrl}/airdrop/rewards?address=${address}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error(err);
    return {} as RewardsApiInterface;
  }
}
