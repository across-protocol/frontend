import axios from "axios";
import { RewardsApiInterface } from "../types";
import { rewardsApiUrl } from "utils";

export default function rewardsApiCall(
  address: string,
  jwt?: string
): Promise<RewardsApiInterface> {
  console.log("jwt", jwt);
  return axios
    .get(`${rewardsApiUrl}/rewards?address=${address}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })
    .then((res) => {
      console.log("res", res);
      return {} as RewardsApiInterface;
    });
}
