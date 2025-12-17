import { utils, BigNumber } from "ethers";
import { SponsoredCCTPDstPeriphery__factory } from "@across-protocol/contracts/dist/typechain";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "./_constants";
import { encodeMakeCallWithBalanceCalldata } from "./_multicall-handler";
import { getProvider } from "./_providers";

const ZK_LIGHTER_ADDRESSES = {
  // https://etherscan.io/address/0x3B4D794a66304F130a4Db8F2551B0070dfCf5ca7
  [CHAIN_IDs.MAINNET]: "0x3B4D794a66304F130a4Db8F2551B0070dfCf5ca7",
};

const LIGHTER_INTERMEDIARY_CHAIN_IDS = {
  [CHAIN_IDs.LIGHTER]: CHAIN_IDs.MAINNET,
};

const LIGHTER_ASSET_INDICES_PER_TOKEN = {
  [TOKEN_SYMBOLS_MAP.USDC.symbol]: 3,
};

const LIGHTER_DEPOSIT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint16", name: "assetIndex", type: "uint16" },
      { internalType: "uint8", name: "routeType", type: "uint8" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

export function isToLighter(chainId: number) {
  return [CHAIN_IDs.LIGHTER].includes(chainId);
}

export function getLighterIntermediaryChainId(destinationChainId: number) {
  const intermediaryChainId =
    LIGHTER_INTERMEDIARY_CHAIN_IDS[destinationChainId];
  if (!intermediaryChainId) {
    throw new Error(
      `Lighter 'intermediaryChainId' not found for chain ${destinationChainId}`
    );
  }
  return intermediaryChainId;
}

export async function buildLighterDepositActionData(params: {
  recipient: string;
  outputTokenSymbol: string;
  routeType: number;
  amount: BigNumber;
  destinationChainId: number;
  sponsoredCCTPDstPeripheryAddress: string;
}) {
  const {
    recipient,
    outputTokenSymbol,
    routeType,
    amount,
    destinationChainId,
    sponsoredCCTPDstPeripheryAddress,
  } = params;

  const assetIndex = LIGHTER_ASSET_INDICES_PER_TOKEN[outputTokenSymbol];
  if (!assetIndex) {
    throw new Error(
      `Lighter 'assetIndex' not found for token symbol ${outputTokenSymbol}`
    );
  }

  const intermediaryChainId = getLighterIntermediaryChainId(destinationChainId);

  const intermediaryTokenAddress =
    TOKEN_SYMBOLS_MAP[outputTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP]
      ?.addresses[intermediaryChainId];
  if (!intermediaryTokenAddress) {
    throw new Error(
      `Lighter 'intermediaryTokenAddress' not found for token symbol ${
        outputTokenSymbol
      } on chain ${intermediaryChainId}`
    );
  }

  const lighterAddress = ZK_LIGHTER_ADDRESSES[intermediaryChainId];
  if (!lighterAddress) {
    throw new Error(
      `'ZkLighter' address not found for chain ${intermediaryChainId}`
    );
  }

  // Calldata for calling the Lighter's 'deposit' function on the intermediary chain
  const lighterDepositInterface = new utils.Interface(LIGHTER_DEPOSIT_ABI);
  const lighterDepositCalldata = lighterDepositInterface.encodeFunctionData(
    "deposit",
    [recipient, assetIndex, routeType, amount]
  );

  const sponsoredCCTPDstPeripheryContract =
    SponsoredCCTPDstPeriphery__factory.connect(
      sponsoredCCTPDstPeripheryAddress,
      getProvider(intermediaryChainId)
    );
  // Get the PermissionedMulticallHandler address from the SponsoredCCTPDstPeriphery contract
  const permissionedMulticallHandlerAddress =
    await sponsoredCCTPDstPeripheryContract.multicallHandler();

  // Dynamically inject the received amount on the intermediary chain into above deposit
  // call
  const makeCallWithBalanceCalldata = encodeMakeCallWithBalanceCalldata(
    lighterAddress,
    lighterDepositCalldata,
    "0", // non-native calls don't need a value
    [
      {
        token: intermediaryTokenAddress,
        offset: 100, // Selector (4) + Arg1 (32) + Arg2 (32) + Arg3 (32) = 100
      },
    ]
  );

  // Compress calls for ArbitraryEVMFlowExecutor
  const compressedCalls = [
    {
      target: permissionedMulticallHandlerAddress,
      callData: makeCallWithBalanceCalldata,
    },
  ];
  return utils.defaultAbiCoder.encode(
    ["tuple(address target, bytes callData)[]"],
    [compressedCalls]
  );
}
