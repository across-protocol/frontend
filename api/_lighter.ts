import { utils, BigNumber, ethers } from "ethers";
import { SponsoredCCTPDstPeriphery__factory } from "@across-protocol/contracts/dist/typechain";

import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "./_constants";
import { encodeMakeCallWithBalanceCalldata } from "./_multicall-handler";
import { getProvider } from "./_providers";
import { AmountTooLowError } from "./_errors";
import { Token } from "./_dexes/types";
import { getCachedTokenInfo } from "./_utils";

const ZK_LIGHTER_ADDRESSES = {
  // https://etherscan.io/address/0x3B4D794a66304F130a4Db8F2551B0070dfCf5ca7
  [CHAIN_IDs.MAINNET]: "0x3B4D794a66304F130a4Db8F2551B0070dfCf5ca7",
};

const LIGHTER_INTERMEDIARY_CHAIN_IDS = {
  [CHAIN_IDs.LIGHTER]: CHAIN_IDs.MAINNET,
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

// Sources:
// - https://mainnet.zklighter.elliot.ai/api/v1/assetDetails
// - https://etherscan.io/address/0xe5fb592ef1b620909000af0d5fb55a3593026142#code#F1#L132
const LIGHTER_MIN_DEPOSIT_AMOUNT = {
  [TOKEN_SYMBOLS_MAP["USDC-SPOT-LIGHTER"].symbol]: BigNumber.from(1000000),
  [TOKEN_SYMBOLS_MAP["USDC-PERPS-LIGHTER"].symbol]: BigNumber.from(1000000),
};

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
  outputAmount: BigNumber;
  outputToken: Token;
  sponsoredCCTPDstPeripheryAddress: string;
}) {
  const {
    recipient,
    outputAmount,
    outputToken,
    sponsoredCCTPDstPeripheryAddress,
  } = params;

  const minDepositAmount = LIGHTER_MIN_DEPOSIT_AMOUNT[outputToken.symbol];
  if (!minDepositAmount) {
    throw new Error(
      `Lighter 'minDepositAmount' not found for token symbol ${outputToken.symbol}`
    );
  }

  if (outputAmount.lt(minDepositAmount)) {
    throw new AmountTooLowError({
      message: "Amount too low for Lighter deposit.",
    });
  }

  const intermediaryChainId = getLighterIntermediaryChainId(
    outputToken.chainId
  );

  const intermediaryToken = await getIntermediaryToken(intermediaryChainId);
  const intermediaryTokenAddress = intermediaryToken.address;

  const lighterAddress = ZK_LIGHTER_ADDRESSES[intermediaryChainId];
  if (!lighterAddress) {
    throw new Error(
      `'ZkLighter' address not found for chain ${intermediaryChainId}`
    );
  }

  const { assetIndex, routeType } = decodeLighterTokenAddress(
    outputToken.address
  );

  // Calldata for calling the Lighter's 'deposit' function on the intermediary chain
  const lighterDepositInterface = new utils.Interface(LIGHTER_DEPOSIT_ABI);
  const lighterDepositCalldata = lighterDepositInterface.encodeFunctionData(
    "deposit",
    [recipient, assetIndex, routeType, BigNumber.from(0)] // Placeholder amount, will be replaced
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

export function decodeLighterTokenAddress(tokenAddress: string) {
  const tokenAddressBytes = ethers.utils.arrayify(tokenAddress);
  const assetIndex = tokenAddressBytes.slice(17, 19); // uint16 from bytes 17-18
  const routeType = tokenAddressBytes.slice(19, 20); // uint8 from byte 19
  return { assetIndex, routeType };
}

async function getIntermediaryToken(
  intermediaryChainId: number
): Promise<Token> {
  const intermediaryUsdcAddress =
    TOKEN_SYMBOLS_MAP["USDC"].addresses[intermediaryChainId];

  if (!intermediaryUsdcAddress) {
    throw new Error(
      `Intermediary USDC address not found for chain ${intermediaryChainId}`
    );
  }

  const tokenInfo = await getCachedTokenInfo({
    address: intermediaryUsdcAddress,
    chainId: intermediaryChainId,
  });

  return tokenInfo;
}
