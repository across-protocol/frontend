import { Wallet, ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "@across-protocol/sdk";
import {
  KeyPairSigner,
  getTransactionDecoder,
  signTransaction,
  sendTransactionWithoutConfirmingFactory,
  getSignatureFromTransaction,
} from "@solana/kit";

import { buildBaseSwapResponseJson } from "../../api/swap/_utils";
import { buildSearchParams } from "../../api/_utils";
import { getSVMRpc } from "../../api/_providers";
import {
  MIN_OUTPUT_CASES,
  EXACT_OUTPUT_CASES,
  EXACT_INPUT_CASES,
  LENS_CASES,
} from "./_swap-cases";

dotenv.config({
  path: [".env.local", ".env"],
});

export type BaseSwapResponse = Awaited<
  ReturnType<typeof buildBaseSwapResponseJson>
>;

// Common args handling
export const argsFromCli = yargs(hideBin(process.argv))
  .command("test-cases", "Run predefined test cases", (yargs) => {
    return yargs.usage("Usage: $0 test-cases [options]").option("filter", {
      alias: "f",
      description:
        "Filter predefined test cases in scripts/tests/_swap-cases.ts by comma-separated list of labels.",
    });
  })
  .option("includeDestinationAction", {
    alias: "da",
    description: "Include destination action.",
    type: "boolean",
    default: false,
  })
  .command("args", "Run with custom args", (yargs) => {
    return yargs
      .usage("Usage: $0 args [options]")
      .option("originChainId", {
        alias: "oc",
        description: "Origin chain ID.",
        default: 10,
      })
      .option("destinationChainId", {
        alias: "dc",
        description: "Destination chain ID.",
        default: 8453,
      })
      .option("inputToken", {
        alias: "it",
        description: "Input token address.",
        type: "string",
        // USDC on Optimism
        default: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      })
      .option("outputToken", {
        alias: "ot",
        description: "Output token address.",
        type: "string",
        // USDC on Base
        default: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      })
      .option("amount", {
        alias: "a",
        description: "Amount of input token.",
        default: 1_000_000,
      })
      .option("slippage", {
        alias: "s",
        description: "Slippage tolerance. 0 <= slippage <= 1, 0.01 = 1%",
      })
      .option("tradeType", {
        alias: "tt",
        description: "Trade type.",
        choices: ["exactOutput", "exactInput", "minOutput"],
      })
      .option("recipient", {
        alias: "r",
        type: "string",
        description: "Recipient address.",
      })
      .option("depositor", {
        alias: "d",
        description: "Depositor address.",
        type: "string",
        default: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      })
      .option("refundAddress", {
        alias: "ra",
        type: "string",
        description: "Refund address.",
      })
      .option("refundOnOrigin", {
        alias: "ro",
        description: "Refund on origin.",
        type: "boolean",
      })
      .option("skipOriginTxEstimation", {
        alias: "sote",
        description: "Skip origin tx estimation.",
        type: "boolean",
      })
      .option("integratorId", {
        alias: "i",
        description: "Integrator ID.",
      })
      .option("includeSources", {
        alias: "is",
        description: "Comma-separated list of sources to include.",
        type: "string",
      })
      .option("excludeSources", {
        alias: "es",
        description: "Comma-separated list of sources to exclude.",
        type: "string",
      })
      .option("appFee", {
        alias: "apf",
        description: "App fee percent. 0 <= appFee <= 1, 0.01 = 1%",
        type: "number",
      })
      .option("appFeeRecipient", {
        alias: "apr",
        description: "App fee recipient.",
        type: "string",
      })
      .option("strictTradeType", {
        alias: "stt",
        description: "Strict trade type.",
        type: "boolean",
        default: true,
      });
  })
  .option("host", {
    alias: "h",
    description: "Host to use for the API",
    default: "http://localhost:3000",
  })
  .option("flowType", {
    alias: "ft",
    description: "Flow type.",
    default: "approval",
    choices: ["approval", "permit", "auth", "unified"],
  })
  .option("skipTxExecution", {
    alias: "ste",
    description: "Skip tx execution.",
    type: "boolean",
    default: false,
  })
  .help()
  .parseSync();

export const { SWAP_API_BASE_URL = "http://localhost:3000" } = process.env;
export const { INDEXER_API_BASE_URL = "https://indexer.api.across.to" } =
  process.env;

export function filterTestCases(
  testCases: {
    labels: string[];
    params: { [key: string]: any };
    body?: { [key: string]: any };
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

export async function fetchSwapQuotes() {
  const flowType = argsFromCli.flowType;
  const includeDestinationAction =
    argsFromCli.includeDestinationAction || false;
  const slug = flowType === "unified" ? undefined : flowType;
  const baseUrl = argsFromCli.host || SWAP_API_BASE_URL;
  const url = `${baseUrl}/api/swap${slug ? `/${slug}` : ""}`;
  console.log("\nFetching swap quotes from:", url);

  const swapQuotes: BaseSwapResponse[] = [];

  // Args are provided via CLI
  if (argsFromCli._.includes("args")) {
    const {
      originChainId,
      destinationChainId,
      inputToken,
      outputToken,
      amount,
      slippage,
      tradeType,
      recipient,
      depositor,
      refundAddress,
      skipOriginTxEstimation,
      includeSources,
      excludeSources,
      appFee,
      appFeeRecipient,
      strictTradeType,
    } = argsFromCli;
    const params = {
      originChainId,
      destinationChainId,
      inputToken,
      outputToken,
      amount,
      slippage,
      tradeType,
      recipient,
      depositor,
      refundAddress,
      skipOriginTxEstimation,
      includeSources:
        typeof includeSources === "string"
          ? includeSources.split(",")
          : includeSources,
      excludeSources:
        typeof excludeSources === "string"
          ? excludeSources.split(",")
          : excludeSources,
      appFee,
      appFeeRecipient,
      strictTradeType,
    };
    console.log("Params:", params);

    const response = await axios.get(url, {
      params,
      paramsSerializer: buildSearchParams,
    });
    swapQuotes.push(response.data as BaseSwapResponse);
  } else {
    // Args are provided via test case filter
    const filterString = (argsFromCli.filter as string) || "";
    const testCases = [
      ...MIN_OUTPUT_CASES,
      ...EXACT_OUTPUT_CASES,
      ...EXACT_INPUT_CASES,
      ...LENS_CASES,
    ];
    const filteredTestCases = filterTestCases(testCases, filterString);

    if (filteredTestCases.length === 0) {
      throw new Error("No test cases found");
    }

    for (const testCase of filteredTestCases) {
      const body = includeDestinationAction
        ? await getDefaultDestinationAction(testCase)
        : undefined;
      console.log("Test case:", testCase.labels.join(" "));
      console.log("Params:", testCase.params);
      console.log("Body:", JSON.stringify(body, null, 2));
      const response = await axios.post(
        `${SWAP_API_BASE_URL}/api/swap${slug ? `/${slug}` : ""}`,
        body,
        { params: testCase.params }
      );
      swapQuotes.push(response.data as BaseSwapResponse);
    }
  }

  return swapQuotes;
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
    const fillTxnRef = await trackFill(tx.hash);
    if (fillTxnRef) {
      console.log("Fill txn ref:", fillTxnRef);
    } else {
      console.log("Fill txn ref not found");
    }
  } catch (e) {
    console.error("Tx reverted", e);
  }
}

export async function signAndWaitAllowanceFlowSvm(params: {
  wallet: KeyPairSigner;
  swapResponse: BaseSwapResponse;
}) {
  if (!params.swapResponse.swapTx || !("data" in params.swapResponse.swapTx)) {
    throw new Error("No swap tx for allowance flow");
  }

  try {
    const txBuffer = Buffer.from(params.swapResponse.swapTx.data, "base64");
    const decodedTx = getTransactionDecoder().decode(txBuffer);
    const signedTx = await signTransaction([params.wallet.keyPair], decodedTx);
    const signature = getSignatureFromTransaction(signedTx);
    console.log("Signed SVM tx:", signature.toString());

    const sendTx = sendTransactionWithoutConfirmingFactory({
      rpc: getSVMRpc(params.swapResponse.swapTx.chainId),
    });
    await sendTx(signedTx, { commitment: "confirmed" });
    console.log("Tx sent and confirmed");

    // TODO: track fill
  } catch (e) {
    console.error("Tx reverted", e);
  }
}

async function trackFill(txHash: string) {
  const MAX_FILL_ATTEMPTS = 15;
  // Wait 2 seconds before starting polling
  await utils.delay(2);
  for (let i = 0; i < MAX_FILL_ATTEMPTS; i++) {
    try {
      const response = await axios.get(
        `${INDEXER_API_BASE_URL}/deposit/status`,
        {
          params: { depositTxnRef: txHash },
        }
      );
      if (response.data.status === "filled") {
        return response.data.fillTxnRef;
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Deposit not found yet, continue trying
      } else {
        // Other error, re-throw
        throw error;
      }
    }
    await utils.delay(1);
  }
}

/**
 * Creates the body to execute an action in the destination chain after bridge and swap.
 * Can be a native ETH transfer, an ETH deposit into Aave or an ERC-20 token transfer.
 */
export async function getDefaultDestinationAction(testCase: {
  params: { [key: string]: any };
}) {
  return testCase.params.outputToken === ethers.constants.AddressZero
    ? await getNativeDestinationAction(testCase)
    : await getERC20DestinationAction(testCase);
}

/**
 * Creates the body to execute a destination action involving native balance.
 */
export async function getNativeDestinationAction(testCase: {
  params: { [key: string]: any };
}) {
  const ACROSS_DEV_WALLET_2 = "0x718648C8c531F91b528A7757dD2bE813c3940608";
  const AAVE_ETH_HANDLER_CONTRACT =
    "0x5283BEcEd7ADF6D003225C13896E536f2D4264FF";
  if (testCase.params.destinationChainId === CHAIN_IDs.ARBITRUM) {
    // If the destination chain is Arbitrum, deposit ETH into Aave
    // ACROSS_DEV_WALLET_2 will receive 'aArbWETH' as a result
    return {
      actions: [
        {
          target: AAVE_ETH_HANDLER_CONTRACT,
          functionSignature:
            "function depositETH(address, address onBehalfOf, uint16 referralCode)",
          args: [
            { value: ethers.constants.AddressZero },
            { value: ACROSS_DEV_WALLET_2 },
            { value: 0 },
          ],
          populateCallValueDynamically: true,
        },
      ],
    };
  } else {
    // For other chains, send all native balance to ACROSS_DEV_WALLET_2
    // Note this uses drainLeftoverTokens instead of a makeCallWithBalance
    return {
      actions: [
        {
          target: ACROSS_DEV_WALLET_2,
          functionSignature: "",
          args: [],
          populateCallValueDynamically: true,
          isNativeTransfer: true,
        },
      ],
    };
  }
}

/**
 * Creates the body to execute an ERC-20 token transfer call in the destination chain after bridge and swap.
 */
export async function getERC20DestinationAction(testCase: {
  params: { [key: string]: any };
}) {
  const ACROSS_DEV_WALLET_2 = "0x718648C8c531F91b528A7757dD2bE813c3940608";
  return {
    actions: [
      {
        target: testCase.params.outputToken,
        functionSignature: "function transfer(address to, uint256 value)",
        args: [
          { value: ACROSS_DEV_WALLET_2 },
          {
            value: testCase.params.amount,
            populateDynamically: true,
            balanceSourceToken: testCase.params.outputToken,
          },
        ],
        value: "0",
      },
    ],
  };
}

export function getSvmSignerSeed() {
  const seedBytesStr = process.env.DEV_WALLET_KEY_PAIR_SVM;
  if (!seedBytesStr) {
    throw new Error(
      "Can't get SVM signer seed. Set 'DEV_WALLET_KEY_PAIR_SVM' in .env.local"
    );
  }
  const parsedSeedArray = seedBytesStr
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((str) => parseInt(str));
  return new Uint8Array(parsedSeedArray);
}
