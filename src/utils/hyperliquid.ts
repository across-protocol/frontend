import { Deposit } from "hooks/useDeposits";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "ethers";

export function isHyperLiquidBoundDeposit(deposit: Deposit) {
  if (deposit.destinationChainId !== CHAIN_IDs.ARBITRUM || !deposit.message) {
    return false;
  }

  try {
    // Try to decode the message as Instructions struct
    const decoded = utils.defaultAbiCoder.decode(
      [
        "tuple(tuple(address target, bytes callData, uint256 value)[] calls, address fallbackRecipient)",
      ],
      deposit.message
    );

    // Check if it has exactly 2 calls
    if (decoded[0].calls.length !== 2) {
      return false;
    }

    // Check if second call is to HyperLiquid Bridge2 contract
    return (
      decoded[0].calls[1].target.toLowerCase() ===
      "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7".toLowerCase()
    );
  } catch {
    return false;
  }
}
