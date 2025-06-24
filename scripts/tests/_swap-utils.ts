import { Wallet } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { buildBaseSwapResponseJson } from "../../api/swap/_utils";
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
const argsFromCli = yargs(hideBin(process.argv))
  .command("test-cases", "Run predefined test cases", (yargs) => {
    return yargs.usage("Usage: $0 test-cases [options]").option("filter", {
      alias: "f",
      description:
        "Filter predefined test cases in scripts/tests/_swap-cases.ts by comma-separated list of labels.",
    });
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
        // USDC on Optimism
        default: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      })
      .option("outputToken", {
        alias: "ot",
        description: "Output token address.",
        // USDC on Base
        default: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      })
      .option("amount", {
        alias: "a",
        description: "Amount of input token.",
        default: 1_000_000,
      })
      .option("slippageTolerance", {
        alias: "s",
        description: "Slippage tolerance.",
      })
      .option("tradeType", {
        alias: "tt",
        description: "Trade type.",
        choices: ["exactOutput", "exactInput"],
      })
      .option("recipient", {
        alias: "r",
        description: "Recipient address.",
      })
      .option("depositor", {
        alias: "d",
        description: "Depositor address.",
        default: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      })
      .option("refundAddress", {
        alias: "ra",
        description: "Refund address.",
      })
      .option("refundOnOrigin", {
        alias: "ro",
        description: "Refund on origin.",
        type: "boolean",
      })
      .option("skipOriginTxEstimation", {
        alias: "ste",
        description: "Skip origin tx estimation.",
        type: "boolean",
      })
      .option("integratorId", {
        alias: "i",
        description: "Integrator ID.",
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
  .help()
  .parseSync();

export const { SWAP_API_BASE_URL = "http://localhost:3000" } = process.env;

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

export async function fetchSwapQuotes() {
  const flowType = argsFromCli.flowType;
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
      slippageTolerance,
      tradeType,
      recipient,
      depositor,
      refundAddress,
      skipOriginTxEstimation,
    } = argsFromCli;
    const params = {
      originChainId,
      destinationChainId,
      inputToken,
      outputToken,
      amount,
      slippageTolerance,
      tradeType,
      recipient,
      depositor,
      refundAddress,
      skipOriginTxEstimation,
    };
    console.log("Params:", params);

    const response = await axios.get(url, {
      params,
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

    const swapQuotes: BaseSwapResponse[] = [];
    for (const testCase of filteredTestCases) {
      console.log("Test case:", testCase.labels.join(" "));
      console.log("Params:", testCase.params);
      const response = await axios.get(
        `${SWAP_API_BASE_URL}/api/swap${slug ? `/${slug}` : ""}`,
        {
          params: testCase.params,
        }
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
  } catch (e) {
    console.error("Tx reverted", e);
  }
}
