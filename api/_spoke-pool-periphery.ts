import { SpokePoolPeriphery__factory } from "./_typechain/factories/SpokePoolPeriphery.sol/SpokePoolPeriphery__factory";
import { SpokePoolPeripheryInterface } from "./_typechain/SpokePoolPeriphery.sol/SpokePoolPeriphery";
import { ENABLED_ROUTES, getProvider } from "./_utils";

const sharedEIP712Types = {
  Fees: [
    {
      name: "amount",
      type: "uint256",
    },
    {
      name: "recipient",
      type: "address",
    },
  ],
  BaseDepositData: [
    {
      name: "inputToken",
      type: "address",
    },
    {
      name: "outputToken",
      type: "bytes32",
    },
    {
      name: "outputAmount",
      type: "uint256",
    },
    {
      name: "depositor",
      type: "address",
    },
    {
      name: "recipient",
      type: "bytes32",
    },
    {
      name: "destinationChainId",
      type: "uint256",
    },
    {
      name: "exclusiveRelayer",
      type: "bytes32",
    },
    {
      name: "quoteTimestamp",
      type: "uint32",
    },
    {
      name: "fillDeadline",
      type: "uint32",
    },
    {
      name: "exclusivityParameter",
      type: "uint32",
    },
    {
      name: "message",
      type: "bytes",
    },
  ],
};

export class UnknownPeripheryOnChain extends Error {
  constructor(chainId: number) {
    super(`Unknown 'SpokePoolPeriphery' on chain ${chainId}`);
  }
}

export class UnknownSwapProxyOnChain extends Error {
  constructor(chainId: number) {
    super(`Unknown 'SwapProxy' on chain ${chainId}`);
  }
}

export enum TransferType {
  Approval = 0,
  Transfer = 1,
  Permit2Approval = 2,
}

export function getSpokePoolPeripheryAddress(
  chainId: number,
  throwIfNotFound = true
) {
  const address =
    ENABLED_ROUTES.spokePoolPeripheryAddresses[
      chainId as keyof typeof ENABLED_ROUTES.spokePoolPeripheryAddresses
    ];
  if (!address && throwIfNotFound) {
    throw new UnknownPeripheryOnChain(chainId);
  }
  return address;
}

export function getSwapProxyAddress(chainId: number) {
  const address =
    ENABLED_ROUTES.swapProxyAddresses[
      chainId as keyof typeof ENABLED_ROUTES.swapProxyAddresses
    ];
  if (!address) {
    throw new UnknownSwapProxyOnChain(chainId);
  }
  return address;
}

export function getSpokePoolPeriphery(address: string, chainId: number) {
  return SpokePoolPeriphery__factory.connect(address, getProvider(chainId));
}

export async function getDepositTypedData(params: {
  depositData: SpokePoolPeripheryInterface.DepositDataStruct;
  chainId: number;
}) {
  const spokePoolPeriphery = getSpokePoolPeriphery(
    getSpokePoolPeripheryAddress(params.chainId),
    params.chainId
  );
  const [domainSeparatorHash, eip712Domain] = await Promise.all([
    spokePoolPeriphery.domainSeparator(),
    spokePoolPeriphery.eip712Domain(),
  ]);

  return {
    domainSeparator: domainSeparatorHash,
    eip712: {
      types: {
        ...sharedEIP712Types,
        DepositData: [
          {
            name: "submissionFees",
            type: "Fees",
          },
          {
            name: "baseDepositData",
            type: "BaseDepositData",
          },
          {
            name: "inputAmount",
            type: "uint256",
          },
        ],
      },
      primaryType: "DepositData",
      domain: {
        name: eip712Domain.name,
        version: eip712Domain.version,
        chainId: params.chainId,
        verifyingContract: eip712Domain.verifyingContract,
      },
      message: params.depositData,
    },
  };
}

export async function getSwapAndDepositTypedData(params: {
  swapAndDepositData: SpokePoolPeripheryInterface.SwapAndDepositDataStruct;
  chainId: number;
}) {
  const spokePoolPeriphery = getSpokePoolPeriphery(
    getSpokePoolPeripheryAddress(params.chainId),
    params.chainId
  );
  const [domainSeparatorHash, eip712Domain] = await Promise.all([
    spokePoolPeriphery.domainSeparator(),
    spokePoolPeriphery.eip712Domain(),
  ]);

  return {
    domainSeparator: domainSeparatorHash,
    eip712: {
      types: {
        ...sharedEIP712Types,
        SwapAndDepositData: [
          {
            name: "submissionFees",
            type: "Fees",
          },
          {
            name: "depositData",
            type: "BaseDepositData",
          },
          {
            name: "swapToken",
            type: "address",
          },
          {
            name: "exchange",
            type: "address",
          },
          {
            name: "transferType",
            type: "uint8",
          },
          {
            name: "swapTokenAmount",
            type: "uint256",
          },
          {
            name: "minExpectedInputTokenAmount",
            type: "uint256",
          },
          {
            name: "routerCalldata",
            type: "bytes",
          },
          {
            name: "enableProportionalAdjustment",
            type: "bool",
          },
          {
            name: "spokePool",
            type: "address",
          },
          {
            name: "nonce",
            type: "uint256",
          },
        ],
      },
      primaryType: "SwapAndDepositData",
      domain: {
        name: eip712Domain.name,
        version: eip712Domain.version,
        chainId: params.chainId,
        verifyingContract: eip712Domain.verifyingContract,
      },
      message: params.swapAndDepositData,
    },
  };
}
