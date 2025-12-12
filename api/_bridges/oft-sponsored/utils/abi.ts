/**
 * ABI for SponsoredOFTSrcPeriphery contract
 * Source periphery contract that users interact with to start sponsored OFT flows
 */
export const SPONSORED_OFT_SRC_PERIPHERY_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "uint32", name: "srcEid", type: "uint32" },
              { internalType: "uint32", name: "dstEid", type: "uint32" },
              {
                internalType: "bytes32",
                name: "destinationHandler",
                type: "bytes32",
              },
              { internalType: "uint256", name: "amountLD", type: "uint256" },
              { internalType: "bytes32", name: "nonce", type: "bytes32" },
              { internalType: "uint256", name: "deadline", type: "uint256" },
              {
                internalType: "uint256",
                name: "maxBpsToSponsor",
                type: "uint256",
              },
              {
                internalType: "bytes32",
                name: "finalRecipient",
                type: "bytes32",
              },
              { internalType: "bytes32", name: "finalToken", type: "bytes32" },
              {
                internalType: "uint256",
                name: "lzReceiveGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "lzComposeGasLimit",
                type: "uint256",
              },
              { internalType: "uint8", name: "executionMode", type: "uint8" },
              { internalType: "bytes", name: "actionData", type: "bytes" },
            ],
            internalType: "struct SignedQuoteParams",
            name: "signedParams",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "address",
                name: "refundRecipient",
                type: "address",
              },
              {
                internalType: "uint256",
                name: "maxUserSlippageBps",
                type: "uint256",
              },
            ],
            internalType: "struct UnsignedQuoteParams",
            name: "unsignedParams",
            type: "tuple",
          },
        ],
        internalType: "struct Quote",
        name: "quote",
        type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
