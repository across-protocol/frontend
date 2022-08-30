import { useState, useEffect } from "react";
// import { Contract, providers } from "ethers";

import { useConnection } from "state/hooks";

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

// const merkleDistributorContract = new Contract(
//   process.env.MERKLE_DISTRIBUTOR_ADDRESS || "",
//   [
//     "function hasClaimed(address) public view returns (bool)",
//     "function claim(address to, uint256 amount, bytes32[] calldata proof) external",
//   ]
// );

export function useMerkleDistributor() {
  const { provider, account } = useConnection();

  const [claimState, setClaimState] = useState<ClaimState>({
    status: "idle",
  });
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    if (account && provider) {
      // merkleDistributorContract
      //   .connect(provider)
      //   .hasClaimed(account)
      //   .then(setHasClaimed);
      mockedHasClaimed().then(setHasClaimed);
    }
  }, [provider, account]);

  const handleClaim = async () => {
    try {
      if (!provider || !account) {
        throw new Error("No wallet connected");
      }

      setClaimState({ status: "pending" });
      // const [amount, proof] = getClaimAmountAndProof(account);
      // const txResponse: providers.TransactionResponse =
      //   await merkleDistributorContract
      //     .connect(provider)
      //     .claim(account, amount, proof);
      const txResponse = await mockedClaim();

      setClaimState({ status: "pendingTx", txHash: txResponse.hash });
      const txReceipt = await txResponse.wait();

      setClaimState({ status: "success", txHash: txReceipt.transactionHash });
    } catch (error) {
      setClaimState({ status: "error", error: error as Error });
    }
  };

  return { handleClaim, claimState, hasClaimed };
}

// TODO: implement
// function getClaimAmountAndProof(account: string) {
//   return ["1", "0x"];
// }

async function mockedClaim() {
  await new Promise((resolve) => setTimeout(() => resolve(true), 5_000));
  return {
    hash: "0xTX_HASH",
    wait: async () => {
      await new Promise((resolve) => setTimeout(() => resolve(true), 15_000));
      return {
        transactionHash: "0xTX_HASH",
      };
    },
  };
}

async function mockedHasClaimed() {
  await new Promise((resolve) => setTimeout(() => resolve(true), 5_000));
  return true;
}
