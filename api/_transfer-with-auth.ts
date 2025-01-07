import { BigNumberish, ethers } from "ethers";
import { getProvider } from "./_utils";
import { ERC_TRANSFER_WITH_AUTH_ABI } from "./_abis";
import { hashDomainSeparator } from "./_eip712";

export class TransferWithAuthNotSupportedError extends Error {
  constructor(tokenAddress: string, cause?: Error) {
    super(
      `ERC-20 contract ${tokenAddress} does not support transfer with authorization`,
      {
        cause,
      }
    );
  }
}

export class TransferWithAuthDomainSeparatorMismatchError extends Error {
  constructor(tokenAddress: string) {
    super(
      `Transfer with authorization EIP712 domain separator mismatch for ${tokenAddress}`
    );
  }
}

export async function getReceiveWithAuthTypedData(params: {
  tokenAddress: string;
  chainId: number;
  ownerAddress: string;
  spenderAddress: string;
  value: BigNumberish;
  validBefore: number;
  nonce: string;
  validAfter?: number;
  eip712DomainVersion?: number;
}) {
  const { name, domainSeparator, eip712DomainVersion } =
    await getReceiveWithAuthArgsFromContract(params);

  return {
    domainSeparator,
    eip712: {
      types: {
        ReceiveWithAuthorization: [
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
      primaryType: "ReceiveWithAuthorization",
      message: {
        from: params.ownerAddress,
        to: params.spenderAddress,
        value: String(params.value),
        validAfter: params.validAfter ?? 0,
        validBefore: params.validBefore,
        nonce: params.nonce, // non-sequential nonce, random 32 byte hex string
      },
    },
  };
}

export async function getReceiveWithAuthArgsFromContract(params: {
  tokenAddress: string;
  chainId: number;
  ownerAddress: string;
  spenderAddress: string;
  value: BigNumberish;
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
    throw new TransferWithAuthNotSupportedError(params.tokenAddress, error);
  }

  const name: string = nameResult.value;
  const versionFromContract =
    versionFromContractResult.status === "fulfilled"
      ? versionFromContractResult.value
      : undefined;
  const domainSeparator: string = domainSeparatorResult.value;

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
    throw new TransferWithAuthDomainSeparatorMismatchError(params.tokenAddress);
  }

  return {
    name,
    domainSeparator,
    eip712DomainVersion,
  };
}
