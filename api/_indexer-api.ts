import axios from "axios";
import { getEnvs } from "./_env";

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
