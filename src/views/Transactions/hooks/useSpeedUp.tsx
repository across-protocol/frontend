import { useState, useEffect } from "react";
import { BigNumber, utils } from "ethers";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";
import { JsonRpcSigner } from "@uma/sdk/dist/types/oracle/types/ethers";
import { SetChainOptions } from "hooks/useOnboard";

import { useConnection } from "state/hooks";
import { useError } from "hooks";
import { getConfig, getChainInfo } from "utils";

type SpeedUpStatus = "idle" | "pending" | "success" | "error";

export function useSpeedUp() {
  const config = getConfig();
  const { chainId, signer, setChain, notify } = useConnection();
  const { addError } = useError();

  const [status, setStatus] = useState<SpeedUpStatus>("idle");
  const [txHashWithLink, setTxHashWithLink] = useState<
    | {
        link: string;
        txHash: string;
      }
    | undefined
  >();

  useEffect(() => {
    if (status === "pending" && txHashWithLink) {
      const { emitter } = notify.hash(txHashWithLink.txHash);
      emitter.on("txSent", () => {
        return {
          link: txHashWithLink.link,
        };
      });
      emitter.on("txConfirmed", () => {
        setStatus("success");
        notify.unsubscribe(txHashWithLink.txHash);
      });
      emitter.on("txFailed", (state) => {
        setStatus("error");
        notify.unsubscribe(txHashWithLink.txHash);
      });

      return () => notify.unsubscribe(txHashWithLink.txHash);
    }
  }, [status, txHashWithLink, notify]);

  const handleSpeedUp = async (
    depositToSpeedUp: Transfer,
    newRelayerFeePct: BigNumber
  ) => {
    try {
      setStatus("pending");

      if (!signer) {
        throw new Error(`Wallet is not connected`);
      }

      await assertCorrectChain(
        chainId,
        depositToSpeedUp.sourceChainId,
        setChain
      );

      const depositorSignature = await getDepositorSignature(signer, {
        originChainId: depositToSpeedUp.sourceChainId,
        newRelayerFeePct,
        depositId: depositToSpeedUp.depositId,
      });

      const spokePool = config.getSpokePool(
        depositToSpeedUp.sourceChainId,
        signer
      );
      const txResponse = await spokePool.speedUpDeposit(
        await signer.getAddress(),
        newRelayerFeePct,
        depositToSpeedUp.depositId,
        depositorSignature
      );

      setTxHashWithLink({
        txHash: txResponse.hash,
        link: getChainInfo(
          depositToSpeedUp.sourceChainId
        ).constructExplorerLink(txResponse.hash),
      });
    } catch (error) {
      setStatus("error");
      console.error(error);
      addError(error as Error);
    }
  };

  return {
    handleSpeedUp,
    status,
  };
}

async function assertCorrectChain(
  connectedChainId: number,
  requiredChainId: number,
  setChain: (opts: SetChainOptions) => Promise<boolean>
) {
  if (connectedChainId !== requiredChainId) {
    const didChange = await setChain({
      chainId: `0x${requiredChainId.toString(16)}`,
    });

    if (!didChange) {
      throw new Error(
        `Wallet needs to be connected to chain with id "${requiredChainId}"`
      );
    }
  }
}

async function getDepositorSignature(
  signer: JsonRpcSigner,
  relayerFeeMessage: {
    originChainId: number;
    newRelayerFeePct: BigNumber;
    depositId: number;
  }
) {
  const depositorMessageHash = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["string", "uint64", "uint32", "uint32"],
      [
        "ACROSS-V2-FEE-1.0",
        relayerFeeMessage.newRelayerFeePct,
        relayerFeeMessage.depositId,
        relayerFeeMessage.originChainId,
      ]
    )
  );

  return signer.signMessage(utils.arrayify(depositorMessageHash));
}
