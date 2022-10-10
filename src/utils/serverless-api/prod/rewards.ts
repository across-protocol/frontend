import axios from "axios";
import { RewardsApiInterface } from "../types";
import { rewardsApiUrl } from "utils";

export default async function rewardsApiCall(
  address: string,
  jwt?: string
): Promise<RewardsApiInterface | null> {
  try {
    const response = await axios.get(`${rewardsApiUrl}/airdrop/rewards`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        address,
      },
    });
    if (response.data) {
      return response.data;
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}
