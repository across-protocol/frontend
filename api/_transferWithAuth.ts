import { EIP712DomainType, hashDomainSeparator } from "./_permit";
import { BigNumberish, ethers } from "ethers";
import { getProvider } from "./_utils";
import { ERC_TRANSFER_WITH_AUTH_ABI } from "./_abis";

export async function getTransferWithAuthTypedData(params: {
  tokenAddress: string;
  chainId: number;
  ownerAddress: string;
  receiverAddress: string;
  value: BigNumberish;
  validBefore: number;
  nonce: string;
  validAfter?: number;
  eip712DomainVersion?: number;
}) {
  const provider = getProvider(params.chainId);

  const erc20Permit = new ethers.Contract(
    params.tokenAddress,
    ERC_TRANSFER_WITH_AUTH_ABI,
    provider
  );

  const [nameResult, versionFromContractResult, domainSeparatorResult] =
    await Promise.allSettled([
      erc20Permit.name(),
      erc20Permit.version(),
      erc20Permit.DOMAIN_SEPARATOR(),
    ]);

  if (
    nameResult.status === "rejected" ||
    domainSeparatorResult.status === "rejected"
  ) {
    const error =
      nameResult.status === "rejected"
        ? nameResult.reason
        : domainSeparatorResult.status === "rejected"
          ? domainSeparatorResult.reason
          : new Error("Unknown error");
    throw new Error(
      `Contract ${params.tokenAddress} does not support transfer with authorization`,
      {
        cause: error,
      }
    );
  }

  const name = nameResult.value;
  const versionFromContract =
    versionFromContractResult.status === "fulfilled"
      ? versionFromContractResult.value
      : undefined;
  const domainSeparator = domainSeparatorResult.value;

  const eip712DomainVersion = [1, 2, "1", "2"].includes(versionFromContract)
    ? Number(versionFromContract)
    : params.eip712DomainVersion || 1;

  const domainSeparatorHash = hashDomainSeparator({
    name,
    version: eip712DomainVersion,
    chainId: params.chainId,
    verifyingContract: params.tokenAddress,
  });

  if (domainSeparator !== domainSeparatorHash) {
    throw new Error("EIP712 domain separator mismatch");
  }

  return {
    domainSeparator,
    eip712: {
      types: {
        EIP712Domain: EIP712DomainType,
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      domain: {
        name,
        version: eip712DomainVersion.toString(),
        chainId: params.chainId,
        verifyingContract: params.tokenAddress,
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: params.ownerAddress,
        to: params.receiverAddress,
        value: String(params.value),
        validAfter: params?.validAfter
          ? convertTimestampToSeconds(params.validAfter)
          : 0,
        validBefore: convertTimestampToSeconds(params.validBefore),
        nonce: params.nonce, // random 32 byte hex string
      },
    },
  };
}

export function convertTimestampToSeconds(timestamp: number): number {
  // rough approximation
  const isMilliseconds = timestamp > 1_000_000_000;
  return isMilliseconds ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
}
