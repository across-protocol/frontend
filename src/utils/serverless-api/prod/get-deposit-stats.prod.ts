import axios from "axios";
import { rewardsApiUrl } from "utils/constants";

export async function getDepositStats(): Promise<{
  totalDeposits: number;
  avgFillTime: number;
  totalVolumeUsd: number;
}> {
  const axiosResponse = await axios.get<{
    totalDeposits: number;
    avgFillTime: number;
    totalVolumeUsd: number;
  }>(`${rewardsApiUrl}/deposits/stats`);
  return axiosResponse.data;
}
