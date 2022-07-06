import axios from "axios";
import { useQuery } from "react-query";

/**
 * Fetches the latest block from a given chain Id on an interval.
 * @param chainId The chain Id of the chain to poll for new blocks.
 * @returns The latest block, and the useQueryResult object.
 */
const queryKey = "FETCH_REFERRALS";

export interface Referral {
  depositTxHash: string;
  sourceChainId: number;
  destinationChainId: number;
  amount: string;
  symbol: string;
  decimals: number;
  depositorAddr: string;
  referralAddress: string;
  depositDate: string;
  realizedLpFeeUsd: number;
  referralRate: number;
  acxRewards: string;
}

export interface GetReferralsResponse {
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  referrals: Referral[];
}

export function useReferrals(account: string) {
  const { data: referrals, ...other } = useQuery(
    queryKey,
    async () => {
      return getReferrals(account!);
    },
    {
      // refetch based on the chain polling interval
      refetchInterval: 60000,
      enabled: !!account,
    }
  );

  return {
    referrals: referrals?.data.referrals || [],
    ...other,
  };
}

/**
 * @param account Address of logged in user.
 * @returns A promise resolving to the referral data of the user
 */
async function getReferrals(account: string) {
  return axios.get<GetReferralsResponse>(
    `${process.env.REACT_APP_REWARDS_API_URL}/referrals/details?address=${account}&limit=30&offset=0`
  );
}
