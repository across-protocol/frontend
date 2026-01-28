import axios from "axios";

import { getEnvs } from "../../../_env";

// Jupiter API types
export type JupiterInstructionAccount = {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
};

export type JupiterIx = {
  programId: string;
  accounts: JupiterInstructionAccount[];
  data: string;
};

export type JupiterSwapIxs = {
  tokenLedgerInstruction?: JupiterIx;
  computeBudgetInstructions: JupiterIx[];
  setupInstructions: JupiterIx[];
  swapInstruction: JupiterIx;
  cleanupInstruction?: JupiterIx;
  addressLookupTableAddresses: string[];
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
};

type SwapOptions = {
  dynamicComputeUnitLimit?: boolean;
  dynamicSlippage?: boolean;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  prioritizationFeeLamports?: any;
};

const JUPITER_BASE_URL = "https://api.jup.ag";
const { JUPITER_API_KEY } = getEnvs();
const JUPITER_API_HEADERS = {
  "Content-Type": "application/json",
  ...(JUPITER_API_KEY ? { "x-api-key": `${JUPITER_API_KEY}` } : {}),
};

// https://dev.jup.ag/docs/api/swap-api/quote
export async function getJupiterQuote(params: any) {
  const response = await axios.get(`${JUPITER_BASE_URL}/swap/v1/quote`, {
    params,
    headers: JUPITER_API_HEADERS,
  });
  return response.data;
}

// https://dev.jup.ag/docs/api/swap-api/swap
export async function getJupiterSwapTransaction(
  quoteResponse: any,
  userPublicKey: string,
  options: SwapOptions = {}
) {
  const response = await axios.post(
    `${JUPITER_BASE_URL}/swap/v1/swap`,
    {
      quoteResponse,
      userPublicKey,
      ...options,
    },
    {
      headers: JUPITER_API_HEADERS,
    }
  );
  return response.data;
}

// https://dev.jup.ag/docs/api/swap-api/swap-instructions
export async function getJupiterSwapInstructions(
  quoteResponse: any,
  userPublicKey: string,
  options: SwapOptions = {}
): Promise<JupiterSwapIxs> {
  const response = await axios.post(
    `${JUPITER_BASE_URL}/swap/v1/swap-instructions`,
    {
      quoteResponse,
      userPublicKey,
      ...options,
    },
    {
      headers: JUPITER_API_HEADERS,
    }
  );
  return response.data;
}

// https://dev.jup.ag/api-reference/tokens/v2/category
export async function getJupiterTokens() {
  const response = await axios.get(
    `${JUPITER_BASE_URL}/tokens/v2/toporganicscore/24h`,
    {
      headers: JUPITER_API_HEADERS,
    }
  );
  return response.data;
}

// https://dev.jup.ag/api-reference/swap/program-id-to-label
export async function getJupiterSwapProgramIdToLabel(): Promise<
  Record<string, string>
> {
  const response = await axios.get(
    `${JUPITER_BASE_URL}/swap/v1/program-id-to-label`,
    {
      headers: JUPITER_API_HEADERS,
    }
  );
  return response.data;
}
