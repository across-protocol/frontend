import { useState, useEffect } from "react";
import { BigNumber, utils } from "ethers";
import { Transfer } from "@across-protocol/sdk-v2/dist/transfers-history";
import { JsonRpcSigner } from "@uma/sdk/dist/types/oracle/types/ethers";

import { useConnection } from "state/hooks";
import { getConfig, getChainInfo, Token } from "utils";
import { useBridgeFees } from "hooks";

type SpeedUpStatus = "idle" | "pending" | "success" | "error";

export function useSpeedUp(transfer: Transfer, token: Token) {
  const config = getConfig();
  const { chainId, signer, setChain, createNotify } = useConnection();
  const { fees, isLoading } = useBridgeFees(
    transfer.amount,
    transfer.destinationChainId,
    token.symbol
  );

  const [isCorrectChain, setIsCorrectChain] = useState(false);
  const [speedUpStatus, setSpeedUpStatus] = useState<SpeedUpStatus>("idle");
  const [speedUpErrorMsg, setSpeedUpErrorMsg] = useState<string>("");
  const [suggestedRelayerFeePct, setSuggestedRelayerFeePct] = useState<
    BigNumber | undefined
  >();

  useEffect(() => {
    setIsCorrectChain(chainId === transfer.sourceChainId);
  }, [chainId, transfer.sourceChainId]);

  useEffect(() => {
    if (fees) {
      setSuggestedRelayerFeePct(fees.relayerFee.pct);
    }
  }, [fees]);

  const speedUp = async (newRelayerFeePct: BigNumber) => {
    try {
      setSpeedUpStatus("pending");
      setSpeedUpErrorMsg("");

      if (!signer) {
        throw new Error(`Wallet is not connected`);
      }

      const depositorSignature = await getDepositorSignature(signer, {
        originChainId: transfer.sourceChainId,
        newRelayerFeePct,
        depositId: transfer.depositId,
      });

      const spokePool = config.getSpokePool(transfer.sourceChainId, signer);
      const txResponse = await spokePool.speedUpDeposit(
        await signer.getAddress(),
        newRelayerFeePct,
        transfer.depositId,
        depositorSignature
      );

      const notify = createNotify({
        networkId: transfer.sourceChainId,
      });
      const { emitter } = notify.hash(txResponse.hash);
      emitter.on("txSent", () => {
        return {
          link: getChainInfo(transfer.sourceChainId).constructExplorerLink(
            txResponse.hash
          ),
        };
      });
      emitter.on("txConfirmed", () => {
        setSpeedUpStatus("success");
        notify.unsubscribe(txResponse.hash);
      });
      emitter.on("txFailed", (state) => {
        setSpeedUpStatus("error");
        setSpeedUpErrorMsg(`Tx failed`);
        notify.unsubscribe(txResponse.hash);
      });
    } catch (error) {
      setSpeedUpStatus("error");
      setSpeedUpErrorMsg((error as Error).message);
      console.error(error);
    }
  };

  return {
    speedUp,
    speedUpStatus,
    speedUpErrorMsg,
    isCorrectChain,
    setChain,
    isFetchingFees: isLoading,
    suggestedRelayerFeePct,
  };
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
