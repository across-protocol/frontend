/**
 * ABI for SponsoredCCTPSrcPeriphery contract
 * Source periphery contract that users interact with to start sponsored CCTP flows
 */
export const SPONSORED_CCTP_SRC_PERIPHERY_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "uint32", name: "sourceDomain", type: "uint32" },
          { internalType: "uint32", name: "destinationDomain", type: "uint32" },
          { internalType: "bytes32", name: "mintRecipient", type: "bytes32" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes32", name: "burnToken", type: "bytes32" },
          {
            internalType: "bytes32",
            name: "destinationCaller",
            type: "bytes32",
          },
          { internalType: "uint256", name: "maxFee", type: "uint256" },
          {
            internalType: "uint32",
            name: "minFinalityThreshold",
            type: "uint32",
          },
          { internalType: "bytes32", name: "nonce", type: "bytes32" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "maxBpsToSponsor", type: "uint256" },
          {
            internalType: "uint256",
            name: "maxUserSlippageBps",
            type: "uint256",
          },
          { internalType: "bytes32", name: "finalRecipient", type: "bytes32" },
          { internalType: "bytes32", name: "finalToken", type: "bytes32" },
          { internalType: "uint8", name: "executionMode", type: "uint8" },
          { internalType: "bytes", name: "actionData", type: "bytes" },
        ],
        internalType: "struct SponsoredCCTPInterface.SponsoredCCTPQuote",
        name: "quote",
        type: "tuple",
      },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "depositForBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
