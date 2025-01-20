import { Deposit } from "hooks/useDeposits";
import { CHAIN_IDs } from "@across-protocol/constants";
import { utils } from "ethers";
import { compareAddressesSimple } from "./sdk";
import { hyperLiquidBridge2Address } from "./constants";

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
    return compareAddressesSimple(
      decoded[0].calls[1].target,
      hyperLiquidBridge2Address
    );
  } catch {
    return false;
  }
}
