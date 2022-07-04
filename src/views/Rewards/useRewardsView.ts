import axios from "axios";
import { useEffect, useState } from "react";
import { useConnection } from "state/hooks";
import ReactTooltip from "react-tooltip";

export interface ReferralsSummary {
  referreeWallets: number;
  transfers: number;
  volume: number;
  referralRate: number;
  rewardsAmount: string;
  tier: number;
}

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

const defaultReferralsSummary: ReferralsSummary = {
  referralRate: 0.4,
  referreeWallets: 0,
  rewardsAmount: "0",
  tier: 1,
  transfers: 0,
  volume: 0,
};

export const useRewardsView = () => {
  const { isConnected, account } = useConnection();
  const [isReferalSummaryLoading, setIsReferalSummaryLoading] = useState(false);
  const [referralsSummary, setReferralsSummary] = useState<
    ReferralsSummary | undefined
  >();
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    if (account) {
      setIsReferalSummaryLoading(true);
      axios
        .get<ReferralsSummary>(
          `http://34.148.101.148:3000/referrals/summary?address=${account}`
        )
        .then((response) => {
          setReferralsSummary(response.data);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setIsReferalSummaryLoading(false);
          ReactTooltip.rebuild();
        });
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      setIsTableLoading(true);
      axios
        .get<GetReferralsResponse>(
          `http://34.148.101.148:3000/referrals/details?address=${account}&limit=30&offset=0`
        )
        .then((response) => {
          setReferrals(response.data.referrals);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setIsTableLoading(false);
        });
    }
  }, [account]);

  return {
    referralsSummary: referralsSummary || defaultReferralsSummary,
    isReferalSummaryLoading,
    isConnected,
    account,
    isTableLoading,
    referrals,
  };
};
