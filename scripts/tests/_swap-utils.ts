import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "@across-protocol/constants";
import { ethers, Wallet } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

import { buildBaseSwapResponseJson } from "../../api/swap/_utils";

dotenv.config();

export type BaseSwapResponse = Awaited<
  ReturnType<typeof buildBaseSwapResponseJson>
>;

export const { SWAP_API_BASE_URL = "http://localhost:3000" } = process.env;

export const depositor = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const originChainId = CHAIN_IDs.OPTIMISM;
export const destinationChainId = CHAIN_IDs.ARBITRUM;
export const anyDestinationOutputTokens = {
  [CHAIN_IDs.ARBITRUM]: "0x74885b4D524d497261259B38900f54e6dbAd2210", // APE
};
export const MIN_OUTPUT_CASES = [
  // B2B
  {
    labels: ["B2B", "MIN_OUTPUT", "USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Native ETH - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2B", "MIN_OUTPUT", "Native ETH - USDC"],
    params: {
      amount: ethers.utils.parseUnits("3", 6).toString(),
      tradeType: "minOutput",
      inputToken: ethers.constants.AddressZero,
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // B2A
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("3", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["B2A", "MIN_OUTPUT", "USDC - Native ETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: ethers.constants.AddressZero,
      destinationChainId,
      depositor,
    },
  },
  // A2B
  {
    labels: ["A2B", "MIN_OUTPUT", "bridged USDC - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["A2B", "MIN_OUTPUT", "USDC - WETH"],
    params: {
      amount: ethers.utils.parseUnits("0.001", 18).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  {
    labels: ["A2B", "MIN_OUTPUT", "WETH - USDC"],
    params: {
      amount: ethers.utils.parseUnits("1", 6).toString(),
      tradeType: "minOutput",
      inputToken: TOKEN_SYMBOLS_MAP.WETH.addresses[originChainId],
      originChainId,
      outputToken: TOKEN_SYMBOLS_MAP.USDC.addresses[destinationChainId],
      destinationChainId,
      depositor,
    },
  },
  // A2A
  {
    labels: ["A2A", "MIN_OUTPUT", "bridged USDC - APE"],
    params: {
      amount: ethers.utils.parseUnits("1", 18).toString(),
      tradeType: "minOutput",
      inputToken:
        TOKEN_SYMBOLS_MAP["USDC.e"].addresses[originChainId] ||
        TOKEN_SYMBOLS_MAP.USDbC.addresses[originChainId],
      originChainId,
      outputToken: anyDestinationOutputTokens[destinationChainId], // APE Coin
      destinationChainId,
      depositor,
    },
  },
];
export const EXACT_OUTPUT_CASES = MIN_OUTPUT_CASES.map((testCase) => ({
  labels: testCase.labels.map((label) => label.replace("MIN", "EXACT")),
  params: {
    ...testCase.params,
    tradeType: "exactOutput",
  },
}));

export function filterTestCases(
  testCases: {
    labels: string[];
    params: { [key: string]: any };
  }[],
  filterString: string
) {
  const labelsToFilter = filterString ? filterString.split(",") : [];
  const filteredTestCases = testCases.filter((testCase) => {
    const matches = labelsToFilter.filter((label) =>
      testCase.labels
        .map((label) => label.toLowerCase())
        .includes(label.toLowerCase())
    );
    return matches.length === labelsToFilter.length;
  });
  return filteredTestCases;
}

export async function fetchSwapQuote(slug?: "approval" | "permit" | "auth") {
  const filterString = process.argv[2];
  const testCases = [...MIN_OUTPUT_CASES, ...EXACT_OUTPUT_CASES];
  const filteredTestCases = filterTestCases(testCases, filterString);
  for (const testCase of filteredTestCases) {
    console.log("\nTest case:", testCase.labels.join(" "));
    console.log("Params:", testCase.params);
    const response = await axios.get(
      `${SWAP_API_BASE_URL}/api/swap${slug ? `/${slug}` : ""}`,
      {
        params: testCase.params,
      }
    );
    console.log(JSON.stringify(response.data, null, 2));
    return response.data as BaseSwapResponse;
  }
}

export async function signAndWaitPermitFlow(params: {
  wallet: Wallet;
  swapResponse: BaseSwapResponse;
}) {
  if (!params.swapResponse.eip712) {
    throw new Error("No EIP712 data for permit");
  }

  // sign permit + deposit
  const permitSig = await params.wallet._signTypedData(
    params.swapResponse.eip712.permit.domain,
    params.swapResponse.eip712.permit.types,
    params.swapResponse.eip712.permit.message
  );
  console.log("Signed permit:", permitSig);

  const depositSig = await params.wallet._signTypedData(
    params.swapResponse.eip712.deposit.domain,
    params.swapResponse.eip712.deposit.types,
    params.swapResponse.eip712.deposit.message
  );
  console.log("Signed deposit:", depositSig);

  // relay
  const relayResponse = await axios.post(`${SWAP_API_BASE_URL}/api/relay`, {
    ...params.swapResponse.swapTx,
    signatures: { permit: permitSig, deposit: depositSig },
  });
  console.log("Relay response:", relayResponse.data);

  // track relay
  while (true) {
    const relayStatusResponse = await axios.get(
      `${SWAP_API_BASE_URL}/api/relay/status?requestHash=${relayResponse.data.requestHash}`
    );
    console.log("Relay status response:", relayStatusResponse.data);

    if (relayStatusResponse.data.status === "success") {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
}

export async function signAndWaitAllowanceFlow(params: {
  wallet: Wallet;
  swapResponse: BaseSwapResponse;
}) {
  if (!params.swapResponse.swapTx || !("data" in params.swapResponse.swapTx)) {
    throw new Error("No swap tx for allowance flow");
  }

  if (params.swapResponse.approvalTxns) {
    console.log("Approval needed...");
    let step = 1;
    for (const approvalTxn of params.swapResponse.approvalTxns) {
      const stepLabel = `(${step}/${params.swapResponse.approvalTxns.length})`;
      const tx = await params.wallet.sendTransaction({
        to: approvalTxn.to,
        data: approvalTxn.data,
      });
      console.log(`${stepLabel} Approval tx hash:`, tx.hash);
      await tx.wait();
      console.log(`${stepLabel} Approval tx mined`);
      step++;
    }
  }

  try {
    const tx = await params.wallet.sendTransaction({
      to: params.swapResponse.swapTx.to,
      data: params.swapResponse.swapTx.data,
      value: params.swapResponse.swapTx.value,
      gasLimit: params.swapResponse.swapTx.gas,
    });
    console.log("Tx hash: ", tx.hash);
    await tx.wait();
    console.log("Tx mined");
  } catch (e) {
    console.error("Tx reverted", e);
  }
}
