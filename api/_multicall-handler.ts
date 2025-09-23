import { BigNumber, ethers } from "ethers";
import { utils } from "@across-protocol/sdk";

export function getMultiCallHandlerAddress(chainId: number) {
  const addressFromSdk = utils.getDeployedAddress(
    "MulticallHandler",
    chainId,
    false
  );
  return addressFromSdk;
}

export function buildMulticallHandlerMessage(params: {
  actions: Array<{
    target: string;
    callData: string;
    value: string;
  }>;
  fallbackRecipient: string;
}) {
  const abiCoder = ethers.utils.defaultAbiCoder;

  return abiCoder.encode(
    [
      "tuple(" +
        "tuple(" +
        "address target," +
        "bytes callData," +
        "uint256 value" +
        ")[]," +
        "address fallbackRecipient" +
        ")",
    ],
    [
      [
        params.actions.map(({ target, callData, value }) => ({
          target,
          callData,
          value: BigNumber.from(value),
        })),
        params.fallbackRecipient,
      ],
    ]
  );
}

export function encodeWethWithdrawCalldata(value: ethers.BigNumber) {
  const withdrawFunction = "function withdraw(uint256 wad)";
  const wethInterface = new ethers.utils.Interface([withdrawFunction]);
  return wethInterface.encodeFunctionData("withdraw", [value]);
}

export function encodeApproveCalldata(
  spender: string,
  value: ethers.BigNumber
) {
  const approveFunction = "function approve(address spender, uint256 value)";
  const erc20Interface = new ethers.utils.Interface([approveFunction]);
  return erc20Interface.encodeFunctionData("approve", [spender, value]);
}

export function encodeTransferCalldata(to: string, value: ethers.BigNumber) {
  const approveFunction = "function transfer(address to, uint256 value)";
  const erc20Interface = new ethers.utils.Interface([approveFunction]);
  return erc20Interface.encodeFunctionData("transfer", [to, value]);
}

export function encodeDrainCalldata(token: string, destination: string) {
  const drainFunction =
    "function drainLeftoverTokens(address token, address payable destination)";
  const multicallHandlerInterface = new ethers.utils.Interface([drainFunction]);
  return multicallHandlerInterface.encodeFunctionData("drainLeftoverTokens", [
    token,
    destination,
  ]);
}

/**
 * Encodes calldata for withdrawing all wrapped native tokens using MulticallHandler's makeCallWithBalance
 * @param token - The wrapped native token contract address
 */
export function encodeWithdrawAllWethCalldata(token: string) {
  return encodeMakeCallWithBalanceCalldata(
    token,
    encodeWethWithdrawCalldata(BigNumber.from(0)), // Placeholder amount, will be replaced
    "0", // No ETH value needed for this call
    // Replacement instructions to dynamically set the balance to withdraw:
    [
      {
        token,
        offset: 4, // Amount is the only parameter, so just skip the first 4 bytes which are the function selector
      },
    ]
  );
}

export function encodeMakeCallWithBalanceCalldata(
  target: string,
  callData: string,
  value: ethers.BigNumberish,
  replacements: Array<{ token: string; offset: ethers.BigNumberish }>
) {
  const makeCallWithBalanceFunction =
    "function makeCallWithBalance(address target, bytes callData, uint256 value, (address token, uint256 offset)[] replacement)";
  const multicallHandlerInterface = new ethers.utils.Interface([
    makeCallWithBalanceFunction,
  ]);
  return multicallHandlerInterface.encodeFunctionData("makeCallWithBalance", [
    target,
    callData,
    value,
    replacements,
  ]);
}
