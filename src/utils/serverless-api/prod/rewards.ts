import axios from "axios";
import { RewardsApiInterface } from "../types";
import { rewardsApiUrl } from "utils";

export default function rewardsApiCall(
  address: string,
  jwt?: string
): Promise<RewardsApiInterface> {
  return axios
    .get(`${rewardsApiUrl}/airdrop/rewards?address=${address}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
    .then((res) => {
      return res.data as RewardsApiInterface;
    });
}
