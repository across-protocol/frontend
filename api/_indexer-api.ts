import axios, { AxiosError } from "axios";
import { getEnvs } from "./_env";

export type DepositStatusResponse = {
  status: "pending" | "filled" | "expired";
  fillTxHash?: string;
  fillTimestamp?: number;
};

export type SponsorshipsFromIndexerResponse = {
  totalSponsorships: {
    chainId: number;
    finalTokens: {
      tokenAddress: string;
      evmAmountSponsored: string;
    }[];
  }[];
  userSponsorships: {
    finalRecipient: string;
    sponsorships: {
      chainId: number;
      finalTokens: {
        tokenAddress: string;
        evmAmountSponsored: string;
      }[];
    }[];
  }[];
  accountActivations: {
    finalRecipient: string;
  }[];
};

const { REACT_APP_INDEXER_BASE_URL } = getEnvs();

export const indexerApiBaseUrl =
  REACT_APP_INDEXER_BASE_URL || "https://indexer.api.across.to";

export async function getSponsorshipsFromIndexer() {
  const response = await axios.get<SponsorshipsFromIndexerResponse>(
    `${indexerApiBaseUrl}/sponsorships`
  );
  const { totalSponsorships, userSponsorships, accountActivations } =
    response.data;
  return {
    totalSponsorships,
    userSponsorships,
    accountActivations,
  };
}

/**
 * Check deposit status from indexer.
 * Returns null if deposit not found (404), throws on other errors.
 */
export async function getDepositStatus(params: {
  originChainId: number;
  depositId: string;
}): Promise<DepositStatusResponse | null> {
  try {
    const response = await axios.get<DepositStatusResponse>(
      `${indexerApiBaseUrl}/deposit/status`,
      {
        params: {
          originChainId: params.originChainId,
          depositId: params.depositId,
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
