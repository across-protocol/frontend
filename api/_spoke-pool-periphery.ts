import { utils } from "ethers";

import { SpokePoolPeriphery__factory } from "./_typechain/factories/SpokePoolPeriphery.sol/SpokePoolPeriphery__factory";
import { SpokePoolPeripheryInterface } from "./_typechain/SpokePoolPeriphery.sol/SpokePoolPeriphery";
import { ENABLED_ROUTES, getProvider, toAddressType } from "./_utils";
import { CHAIN_IDs } from "./_constants";

const SPOKE_POOL_PERIPHERY_ADDRESS_OVERRIDES = {
  [CHAIN_IDs.OPTIMISM]: "0xd9c11d43822cF15c8edce5C341b32Ed416cd0a89",
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
  const override = SPOKE_POOL_PERIPHERY_ADDRESS_OVERRIDES[chainId];
  if (override) {
    return override;
  }
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

type Eip712Types = Record<string, Array<{ name: string; type: string }>>;

const structNameByParamName: Record<string, string> = {
  submissionFees: "Fees",
  baseDepositData: "BaseDepositData",
  depositData: "BaseDepositData",
};

const spokePoolPeripheryInterface =
  SpokePoolPeriphery__factory.createInterface();

function buildEip712Types(param: utils.ParamType, typeName: string) {
  if (param.baseType !== "tuple") {
    throw new Error(`Expected tuple param for ${typeName}`);
  }

  const types: Eip712Types = {};
  const visit = (tupleParam: utils.ParamType, tupleTypeName: string) => {
    types[tupleTypeName] = (tupleParam.components ?? []).map((component) => {
      if (component.baseType === "tuple") {
        const nestedTypeName = structNameByParamName[component.name];
        if (!nestedTypeName) {
          throw new Error(
            `Unknown struct name for tuple field '${component.name}'`
          );
        }
        visit(component, nestedTypeName);
        return { name: component.name, type: nestedTypeName };
      }
      return { name: component.name, type: component.type };
    });
  };

  visit(param, typeName);
  return types;
}

const depositTypedDataTypes = buildEip712Types(
  spokePoolPeripheryInterface.getFunction("depositWithAuthorization").inputs[1],
  "DepositData"
);
const swapAndDepositTypedDataTypes = buildEip712Types(
  spokePoolPeripheryInterface.getFunction("swapAndBridgeWithAuthorization")
    .inputs[1],
  "SwapAndDepositData"
);

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
      types: depositTypedDataTypes,
      primaryType: "DepositData",
      domain: {
        name: eip712Domain.name,
        version: eip712Domain.version,
        chainId: params.chainId,
        verifyingContract: eip712Domain.verifyingContract,
      },
      message: {
        ...params.depositData,
        baseDepositData: {
          ...params.depositData.baseDepositData,
          recipient: toAddressType(
            params.depositData.baseDepositData.recipient.toString(),
            Number(
              params.depositData.baseDepositData.destinationChainId.toString()
            )
          ).toBytes32(),
          outputToken: toAddressType(
            params.depositData.baseDepositData.outputToken.toString(),
            Number(
              params.depositData.baseDepositData.destinationChainId.toString()
            )
          ).toBytes32(),
          exclusiveRelayer: toAddressType(
            params.depositData.baseDepositData.exclusiveRelayer.toString(),
            Number(
              params.depositData.baseDepositData.destinationChainId.toString()
            )
          ).toBytes32(),
        },
      },
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
      types: swapAndDepositTypedDataTypes,
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
