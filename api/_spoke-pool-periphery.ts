import { BigNumber } from "ethers";
import { extractDepositDataStruct } from "./_dexes/utils";
import { SpokePoolPeripheryProxy__factory } from "./_typechain/factories/SpokePoolPeripheryProxy__factory";
import { SpokePoolV3Periphery__factory } from "./_typechain/factories/SpokePoolV3Periphery__factory";
import { ENABLED_ROUTES, getProvider } from "./_utils";

const sharedEIP712Types = {
  EIP712Domain: [
    {
      name: "name",
      type: "string",
    },
    {
      name: "version",
      type: "string",
    },
    {
      name: "chainId",
      type: "uint256",
    },
    {
      name: "verifyingContract",
      type: "address",
    },
  ],
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
      type: "address",
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
      type: "address",
    },
    {
      name: "destinationChainId",
      type: "uint256",
    },
    {
      name: "exclusiveRelayer",
      type: "address",
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

export class UnknownPeripheryProxyOnChain extends Error {
  constructor(chainId: number) {
    super(`Unknown 'SpokePoolPeripheryProxy' on chain ${chainId}`);
  }
}

export enum TransferType {
  Approval = 0,
  Transfer = 1,
  Permit2Approval = 2,
}

export function getSpokePoolPeripheryAddress(chainId: number) {
  const address =
    ENABLED_ROUTES.spokePoolPeripheryAddresses[
      chainId as keyof typeof ENABLED_ROUTES.spokePoolPeripheryAddresses
    ];
  if (!address) {
    throw new UnknownPeripheryOnChain(chainId);
  }
  return address;
}

export function getSpokePoolPeripheryProxyAddress(chainId: number) {
  const address =
    ENABLED_ROUTES.spokePoolPeripheryProxyAddresses[
      chainId as keyof typeof ENABLED_ROUTES.spokePoolPeripheryProxyAddresses
    ];
  if (!address) {
    throw new UnknownPeripheryProxyOnChain(chainId);
  }
  return address;
}

export function getSpokePoolPeriphery(address: string, chainId: number) {
  return SpokePoolV3Periphery__factory.connect(address, getProvider(chainId));
}

export function getSpokePoolPeripheryProxy(address: string, chainId: number) {
  return SpokePoolPeripheryProxy__factory.connect(
    address,
    getProvider(chainId)
  );
}

export async function getDepositTypedData(params: {
  depositData: {
    submissionFees: {
      amount: BigNumber;
      recipient: string;
    };
    baseDepositData: Awaited<ReturnType<typeof extractDepositDataStruct>>;
    inputAmount: BigNumber;
  };
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
  swapAndDepositData: {
    submissionFees: {
      amount: BigNumber;
      recipient: string;
    };
    depositData: Awaited<ReturnType<typeof extractDepositDataStruct>>;
    swapToken: string;
    exchange: string;
    transferType: TransferType;
    swapTokenAmount: BigNumber;
    minExpectedInputTokenAmount: BigNumber;
    routerCalldata: string;
  };
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
