import { useState } from "react";

type ClaimState =
  | {
      status: "idle";
    }
  | {
      status: "pending";
    }
  | {
      status: "pendingTx";
      txHash: string;
    }
  | {
      status: "success";
      txHash: string;
    }
  | {
      status: "error";
      error: Error;
    };

export function useClaim() {
  const [claimState, setClaimState] = useState<ClaimState>({
    status: "idle",
  });

  const handleClaim = async () => {
    try {
      setClaimState({ status: "pending" });
      const txResponse = await claim();

      setClaimState({ status: "pendingTx", txHash: txResponse.txHash });
      const txReceipt = await txResponse.wait();

      setClaimState({ status: "success", txHash: txReceipt.txHash });
    } catch (error) {
      setClaimState({ status: "error", error: error as Error });
    }
  };

  return { handleClaim, claimState };
}

// TODO: use correct function
async function claim() {
  await new Promise((resolve) => setTimeout(() => resolve(true), 5_000));
  return {
    txHash: "0xTX_HASH",
    wait: async () => {
      await new Promise((resolve) => setTimeout(() => resolve(true), 15_000));
      return {
        txHash: "0xTX_HASH",
      };
    },
  };
}
