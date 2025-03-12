import { Wallet, utils } from "ethers";

import { RelayRequest, RelayStrategy } from "../_types";
import { encodeCalldataForRelayRequest } from "../_utils";
import { redisCache } from "../../_cache";
import { getProvider } from "../../_utils";

const localSignerPrivateKeys =
  process.env.LOCAL_SIGNER_PRIVATE_KEYS!.split(",");
const balanceAlertThreshold = utils.parseEther("0.000001"); // TODO: Refine value

export function getLocalSignersStrategy(): RelayStrategy {
  return {
    strategyName: "local-signers",
    queueParallelism: 1, // TODO: Should be dynamic based on the number of local signers
    relay: async (request: RelayRequest) => {
      const encodedCalldata = encodeCalldataForRelayRequest(request);

      if (localSignerPrivateKeys.length === 0) {
        throw new Error(
          "Can not relay tx via local signers: No local signers found"
        );
      }

      for (const signerPrivateKey of localSignerPrivateKeys) {
        const provider = getProvider(request.chainId);
        const wallet = new Wallet(signerPrivateKey, provider);
        try {
          await lockSigner(wallet.address, request.chainId);

          const balance = await wallet.getBalance();
          if (balance.lt(balanceAlertThreshold)) {
            // TODO: Send PD alert
          }

          const txRequest = {
            chainId: request.chainId,
            to: request.to,
            data: encodedCalldata,
            from: wallet.address,
          };
          const tx = await wallet.sendTransaction(txRequest);
          const receipt = await tx.wait();
          return receipt.transactionHash;
        } catch (error) {
          if (error instanceof SignerLockedError) {
            continue;
          }
          throw error;
        } finally {
          await unlockSigner(wallet.address, request.chainId);
        }
      }

      throw new Error(
        "Can not relay tx via local signers: All local signers are locked"
      );
    },
  };
}

async function lockSigner(signerAddress: string, chainId: number) {
  const lockKey = getLockKey(signerAddress, chainId);
  const lockValue = await redisCache.get(lockKey);

  if (lockValue) {
    throw new SignerLockedError(signerAddress, chainId);
  }

  await redisCache.set(lockKey, "true", 30);
}

async function unlockSigner(signerAddress: string, chainId: number) {
  const lockKey = getLockKey(signerAddress, chainId);

  const lockValue = await redisCache.get(lockKey);
  if (!lockValue) {
    return;
  }

  await redisCache.del(lockKey);
}

function getLockKey(signerAddress: string, chainId: number) {
  return `signer-lock:${signerAddress}:${chainId}`;
}

class SignerLockedError extends Error {
  constructor(signerAddress: string, chainId: number) {
    super(`Signer ${signerAddress} on chain ${chainId} is already locked`);
  }
}
