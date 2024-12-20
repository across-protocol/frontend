export const MINIMAL_BALANCER_V2_POOL_ABI = [
  {
    inputs: [],
    name: "getPoolId",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVault",
    outputs: [{ internalType: "contract IVault", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const MINIMAL_BALANCER_V2_VAULT_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "poolId", type: "bytes32" }],
    name: "getPoolTokens",
    outputs: [
      { internalType: "contract IERC20[]", name: "tokens", type: "address[]" },
      { internalType: "uint256[]", name: "balances", type: "uint256[]" },
      { internalType: "uint256", name: "lastChangeBlock", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const MINIMAL_MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "getEthBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const ERC20_PERMIT_ABI = [
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
];

export const ERC_TRANSFER_WITH_AUTH_ABI = [
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
];
