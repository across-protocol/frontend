import { BigNumber, providers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { ERC20__factory } from "@across-protocol/contracts/dist/typechain";

import { getSvmProvider, getProvider } from "./_providers";
import { BLOCK_TAG_LAG } from "./_constants";
import { getMulticall3, callViaMulticall3 } from "./_multicall";
import { toSolanaKitAddress } from "./_address";

/**
 * Resolves the balance of a given token at a provided address.
 * @param chainId The chain Id to query against
 * @param account A valid Web3 wallet address
 * @param token The valid token address on the given `chainId`.
 * @returns A promise that resolves to the BigNumber of the balance
 */
export async function getBalance(
  chainId: string | number,
  account: string,
  token: string,
  blockTag?: string | number
): Promise<BigNumber> {
  if (sdk.utils.chainIsSvm(Number(chainId))) {
    return getSvmBalance(chainId, account, token);
  }
  return sdk.utils.getTokenBalance(
    account,
    token,
    getProvider(Number(chainId)),
    blockTag ?? BLOCK_TAG_LAG
  );
}

async function getSvmBalance(
  chainId: string | number,
  account: string,
  token: string
) {
  const tokenMint = sdk.utils.toAddressType(token, Number(chainId));
  const owner = sdk.utils.toAddressType(account, Number(chainId));
  const svmProvider = getSvmProvider(Number(chainId)).createRpcClient();

  if (tokenMint.isZeroAddress()) {
    const address = toSolanaKitAddress(owner);
    const balance = await svmProvider.getBalance(address).send();
    return BigNumber.from(balance.value);
  }

  // Get the associated token account address
  const tokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
    owner.forceSvmAddress(),
    tokenMint.forceSvmAddress()
  );

  let balance: BigNumber;
  try {
    // Get token account info
    const tokenAccountInfo = await svmProvider
      .getTokenAccountBalance(tokenAccount)
      .send();
    balance = BigNumber.from(tokenAccountInfo.value.amount);
  } catch (error) {
    // If token account doesn't exist or other error, return 0 balance
    balance = BigNumber.from(0);
  }
  return balance;
}

export async function getBatchBalance(
  chainId: string | number,
  addresses: string[],
  tokenAddresses: string[],
  blockTag: providers.BlockTag = "latest"
) {
  if (sdk.utils.chainIsSvm(Number(chainId))) {
    return getBatchSvmBalance(chainId, addresses, tokenAddresses);
  }
  return getBatchBalanceViaMulticall3(
    chainId,
    addresses,
    tokenAddresses,
    blockTag
  );
}

/**
 * Fetches the balances for an array of addresses on a particular chain, for a particular erc20 token
 * @param chainId The blockchain Id to query against
 * @param addresses An array of valid Web3 wallet addresses
 * @param tokenAddress The valid ERC20 token address on the given `chainId` or ZERO_ADDRESS for native balances
 * @param blockTag Block to query from, defaults to latest block
 * @returns a Promise that resolves to an array of BigNumbers
 */
export async function getBatchBalanceViaMulticall3(
  chainId: string | number,
  addresses: string[],
  tokenAddresses: string[],
  blockTag: providers.BlockTag = "latest"
): Promise<{
  blockNumber: providers.BlockTag;
  balances: Record<string, Record<string, string>>;
}> {
  const chainIdAsInt = Number(chainId);
  const provider = getProvider(chainIdAsInt);

  const multicall3 = getMulticall3(chainIdAsInt, provider);

  if (!multicall3) {
    throw new Error("No Multicall3 deployed on this chain");
  }

  let calls: Parameters<typeof callViaMulticall3>[1] = [];

  for (const tokenAddress of tokenAddresses) {
    if (tokenAddress === sdk.constants.ZERO_ADDRESS) {
      // For native currency
      calls.push(
        ...addresses.map((address) => ({
          contract: multicall3,
          functionName: "getEthBalance",
          args: [address],
        }))
      );
    } else {
      // For ERC20 tokens
      const erc20Contract = ERC20__factory.connect(tokenAddress, provider);
      calls.push(
        ...addresses.map((address) => ({
          contract: erc20Contract,
          functionName: "balanceOf",
          args: [address],
        }))
      );
    }
  }

  const inputs = calls.map(({ contract, functionName, args }) => ({
    target: contract.address,
    callData: contract.interface.encodeFunctionData(functionName, args),
  }));

  const [blockNumber, results] = await multicall3.callStatic.aggregate(inputs, {
    blockTag,
  });

  const decodedResults = results.map((result, i) =>
    calls[i].contract.interface.decodeFunctionResult(
      calls[i].functionName,
      result
    )
  );

  let balances: Record<string, Record<string, string>> = {};

  let resultIndex = 0;
  for (const tokenAddress of tokenAddresses) {
    addresses.forEach((address) => {
      if (!balances[address]) {
        balances[address] = {};
      }
      balances[address][tokenAddress] = decodedResults[resultIndex].toString();
      resultIndex++;
    });
  }

  return {
    blockNumber: blockNumber.toNumber(),
    balances,
  };
}

export async function getBatchSvmBalance(
  chainId: string | number,
  addresses: string[],
  tokenAddresses: string[],
  blockTag: providers.BlockTag = "latest"
) {
  const balances: Record<string, Record<string, string>> = {};

  for (const tokenAddress of tokenAddresses) {
    const callsPerAddress = addresses.map((address) =>
      getSvmBalance(chainId, address, tokenAddress)
    );
    const results = await Promise.all(callsPerAddress);
    for (const [index, result] of Object.entries(results)) {
      const address = addresses[Number(index)];
      if (!balances[address]) {
        balances[address] = {};
      }
      balances[address][tokenAddress] = result.toString();
    }
  }
  return {
    blockNumber: blockTag,
    balances,
  };
}
