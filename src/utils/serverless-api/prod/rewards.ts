import axios from "axios";
import { RewardsApiInterface } from "../types";

export default function rewardsApiCall(
  address: string,
  jwt?: string
): Promise<RewardsApiInterface> {
  return axios
    .get("/rewards", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        address,
      },
    })
    .then((res) => {
      console.log("res", res);
      return {} as RewardsApiInterface;
    });
}
