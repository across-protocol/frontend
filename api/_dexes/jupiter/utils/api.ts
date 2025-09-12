import axios from "axios";

const JUPITER_BASE_URL = "https://lite-api.jup.ag/swap/v1";

type SwapOptions = {
  dynamicComputeUnitLimit?: boolean;
  dynamicSlippage?: boolean;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  prioritizationFeeLamports?: any;
};

// https://dev.jup.ag/docs/api/swap-api/quote
export async function getJupiterQuote(params: any) {
  const response = await axios.get(`${JUPITER_BASE_URL}/quote`, { params });
  return response.data;
}

// https://dev.jup.ag/docs/api/swap-api/swap
export async function getJupiterSwapTransaction(
  quoteResponse: any,
  userPublicKey: string,
  options: SwapOptions = {}
) {
  const response = await axios.post(`${JUPITER_BASE_URL}/swap`, {
    quoteResponse,
    userPublicKey,
    ...options,
  });
  return response.data;
}

// https://dev.jup.ag/docs/api/swap-api/swap-instructions
export async function getJupiterSwapInstructions(
  quoteResponse: any,
  userPublicKey: string,
  options: SwapOptions = {}
) {
  const response = await axios.post(`${JUPITER_BASE_URL}/swap-instructions`, {
    quoteResponse,
    userPublicKey,
    ...options,
  });
  return response.data;
}
