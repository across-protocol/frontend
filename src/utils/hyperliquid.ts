import { Deposit } from "hooks/useDeposits";
import { CHAIN_IDs } from "@across-protocol/constants";
import { BigNumber, Contract, providers, Signer, utils } from "ethers";
import { compareAddressesSimple } from "./sdk";
import { getToken, hyperLiquidBridge2Address } from "./constants";

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

/**
 * Creates a payload that will be ingested by Bridge2/batchedDepositWithPermit of a single deposit
 */
export async function generateHyperLiquidPayload(
  signer: Signer,
  recipient: string,
  amount: BigNumber
) {
  const source = await signer.getAddress();

  if (!compareAddressesSimple(source, recipient)) {
    throw new Error("Source and recipient must be the same");
  }

  const timestamp = Date.now();
  const deadline = Math.floor(timestamp / 1000) + 3600;

  // Create USDC contract interface
  const usdcInterface = new utils.Interface([
    "function nonces(address owner) view returns (uint256)",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  ]);

  const usdcContract = new Contract(
    getToken("USDC").addresses![CHAIN_IDs.ARBITRUM],
    usdcInterface,
    signer
  );

  // USDC permit signature with verified domain parameters
  const usdcDomain = {
    name: "USD Coin",
    version: "2",
    chainId: CHAIN_IDs.ARBITRUM,
    verifyingContract: getToken("USDC").addresses![CHAIN_IDs.ARBITRUM]!,
  };

  const permitTypes = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const permitValue = {
    owner: source,
    spender: hyperLiquidBridge2Address,
    value: amount,
    nonce: await usdcContract.nonces(source),
    deadline,
  };

  const permitSignature = await (
    signer as providers.JsonRpcSigner
  )._signTypedData(usdcDomain, permitTypes, permitValue);
  const { r, s, v } = utils.splitSignature(permitSignature);

  const deposit = {
    user: source,
    usd: amount,
    deadline,
    signature: { r: BigNumber.from(r), s: BigNumber.from(s), v },
  };

  const iface = new utils.Interface([
    "function batchedDepositWithPermit(tuple(address user, uint64 usd, uint64 deadline, tuple(uint256 r, uint256 s, uint8 v) signature)[] deposits)",
  ]);

  return iface.encodeFunctionData("batchedDepositWithPermit", [[deposit]]);
}
