import { BigNumber, ethers } from "ethers";

export function getMultiCallHandlerAddress(chainId: number) {
  // @todo: use API to source addresses?
  const defaultAddress = "0x924a9f036260DdD5808007E1AA95f08eD08aA569";
  switch (chainId) {
    case 324:
      return "0x863859ef502F0Ee9676626ED5B418037252eFeb2";
    case 59144:
      return "0x1015c58894961F4F7Dd7D68ba033e28Ed3ee1cDB";
    default:
      return defaultAddress;
  }
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
