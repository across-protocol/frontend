import { BigNumberish, ethers } from "ethers";

import { getProvider } from "./_utils";
import { ERC20_PERMIT_ABI } from "./_abis";

export class PermitNotSupportedError extends Error {
  constructor(tokenAddress: string, cause?: Error) {
    super(`ERC-20 contract ${tokenAddress} does not support permit`, {
      cause,
    });
  }
}

export class PermitDomainSeparatorMismatchError extends Error {
  constructor(tokenAddress: string) {
    super(`Permit EIP712 domain separator mismatch for ${tokenAddress}`);
  }
}

export async function getPermitTypedData(params: {
  tokenAddress: string;
  chainId: number;
  ownerAddress: string;
  spenderAddress: string;
  value: BigNumberish;
  deadline: number;
  eip712DomainVersion?: number;
}) {
  const { domainSeparator, eip712DomainVersion, nonce } =
    await getPermitArgsFromContract(params);

  return {
    domainSeparator,
    eip712: {
      types: {
        Permit: [
          {
            name: "owner",
            type: "address",
          },
          {
            name: "spender",
            type: "address",
          },
          {
            name: "value",
            type: "uint256",
          },
          {
            name: "nonce",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
        ],
      },
      primaryType: "Permit",
      domain: {
        name,
        version: eip712DomainVersion.toString(),
        chainId: params.chainId,
        verifyingContract: params.tokenAddress,
      },
      message: {
        owner: params.ownerAddress,
        spender: params.spenderAddress,
        value: String(params.value),
        nonce: String(nonce),
        deadline: String(params.deadline),
      },
    },
  };
}

export async function getPermitArgsFromContract(params: {
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
    ERC20_PERMIT_ABI,
    provider
  );

  const [
    nameResult,
    versionFromContractResult,
    nonceResult,
    domainSeparatorResult,
  ] = await Promise.allSettled([
    erc20Permit.name(),
    erc20Permit.version(),
    erc20Permit.nonces(params.ownerAddress),
    erc20Permit.DOMAIN_SEPARATOR(),
  ]);

  if (
    nameResult.status === "rejected" ||
    nonceResult.status === "rejected" ||
    domainSeparatorResult.status === "rejected"
  ) {
    const error =
      nameResult.status === "rejected"
        ? nameResult.reason
        : nonceResult.status === "rejected"
          ? nonceResult.reason
          : domainSeparatorResult.status === "rejected"
            ? domainSeparatorResult.reason
            : new Error("Unknown error");
    throw new PermitNotSupportedError(params.tokenAddress, error);
  }

  const name = nameResult.value;
  const versionFromContract =
    versionFromContractResult.status === "fulfilled"
      ? versionFromContractResult.value
      : undefined;
  const nonce = nonceResult.value;
  const domainSeparator = domainSeparatorResult.value;

  const eip712DomainVersion = [1, 2, "1", "2"].includes(versionFromContract)
    ? Number(versionFromContract)
    : params.eip712DomainVersion || 1;

  const domainSeparatorHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        ethers.utils.id(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        ethers.utils.id(name),
        ethers.utils.id(eip712DomainVersion.toString()),
        params.chainId,
        params.tokenAddress,
      ]
    )
  );

  if (domainSeparator !== domainSeparatorHash) {
    throw new PermitDomainSeparatorMismatchError(params.tokenAddress);
  }

  return {
    domainSeparator,
    eip712DomainVersion,
    nonce,
  };
}
