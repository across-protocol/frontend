import type { Meta, StoryObj } from "@storybook/react";
import { BigNumber } from "ethers";

import {
  BridgeButtonState,
  ConfirmationButton,
} from "../views/SwapAndBridge/components/ConfirmationButton";
import { EnrichedToken } from "../views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";
import { SwapApprovalApiCallReturnType } from "../utils/serverless-api/prod/swap-approval";
import { PriceImpact } from "../views/SwapAndBridge/utils/fees";
import type { BridgeProvider } from "../../api/_dexes/types";

const mockInputToken: EnrichedToken = {
  chainId: 1,
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  priceUSD: "1.00",
  coinKey: "usdc",
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  routeSource: "bridge",
  balance: BigNumber.from("1000000000"),
  balanceUsd: 1000,
};

const mockOutputToken: EnrichedToken = {
  chainId: 42161,
  address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  priceUSD: "1.00",
  coinKey: "usdc",
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  routeSource: "bridge",
  balance: BigNumber.from("500000000"),
  balanceUsd: 500,
};

const mockToken = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  chainId: 1,
  decimals: 6,
  symbol: "USDC",
};

const mockOutputApiToken = {
  address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  chainId: 42161,
  decimals: 6,
  symbol: "USDC",
};

const mockSwapQuote: SwapApprovalApiCallReturnType = {
  crossSwapType: "bridgeOnly",
  amountType: "exactInput",
  approvalTxns: undefined,
  eip712: undefined,
  checks: {
    allowance: {
      token: mockToken.address,
      spender: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
      actual: BigNumber.from("0"),
      expected: BigNumber.from("100000000"),
    },
    balance: {
      token: mockToken.address,
      actual: BigNumber.from("1000000000"),
      expected: BigNumber.from("100000000"),
    },
  },
  steps: {
    originSwap: undefined,
    destinationSwap: undefined,
    bridge: {
      inputAmount: BigNumber.from("100000000"),
      outputAmount: BigNumber.from("99500000"),
      tokenIn: mockToken,
      tokenOut: mockOutputApiToken,
      fees: {
        amount: BigNumber.from("500000"),
        pct: BigNumber.from("5000000000000000"),
        token: mockToken,
        details: {
          type: "across",
          lp: {
            amount: BigNumber.from("100000"),
            pct: BigNumber.from("1000000000000000"),
          },
          relayerCapital: {
            amount: BigNumber.from("200000"),
            pct: BigNumber.from("2000000000000000"),
          },
          destinationGas: {
            amount: BigNumber.from("200000"),
            pct: BigNumber.from("2000000000000000"),
          },
        },
      },
      provider: "across",
    },
  },
  inputToken: mockToken,
  outputToken: mockOutputApiToken,
  refundToken: mockToken,
  inputAmount: BigNumber.from("100000000"),
  maxInputAmount: BigNumber.from("100000000"),
  expectedOutputAmount: BigNumber.from("99500000"),
  minOutputAmount: BigNumber.from("99000000"),
  expectedFillTime: 45,
  swapTx: {
    simulationSuccess: true,
    chainId: 1,
    to: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
    data: "0x",
    value: undefined,
    gas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  },
  fees: {
    total: {
      amount: BigNumber.from("500000"),
      amountUsd: "0.50",
      pct: BigNumber.from("5000000000000000"),
      token: mockToken,
      details: {
        type: "TOTAL_BREAKDOWN",
        swapImpact: {
          amount: BigNumber.from("0"),
          amountUsd: "0.00",
          pct: undefined,
          token: mockToken,
        },
        app: {
          amount: BigNumber.from("0"),
          amountUsd: "0.00",
          pct: undefined,
          token: mockToken,
        },
        bridge: {
          amount: BigNumber.from("500000"),
          amountUsd: "0.50",
          pct: BigNumber.from("5000000000000000"),
          token: mockToken,
          details: undefined,
        },
      },
    },
    totalMax: {
      amount: BigNumber.from("600000"),
      amountUsd: "0.60",
      pct: BigNumber.from("6000000000000000"),
      token: mockToken,
      details: {
        type: "MAX_TOTAL_BREAKDOWN",
        maxSwapImpact: {
          amount: BigNumber.from("0"),
          amountUsd: "0.00",
          pct: undefined,
          token: mockToken,
        },
        app: {
          amount: BigNumber.from("0"),
          amountUsd: "0.00",
          pct: undefined,
          token: mockToken,
        },
        bridge: {
          amount: BigNumber.from("600000"),
          amountUsd: "0.60",
          pct: BigNumber.from("6000000000000000"),
          token: mockToken,
          details: undefined,
        },
      },
    },
    originGas: {
      amount: BigNumber.from("50000"),
      amountUsd: "0.05",
      pct: undefined,
      token: mockToken,
    },
  },
};

const mockPriceImpact: PriceImpact = {
  tooHigh: false,
  priceImpact: 0.005,
  priceImpactFormatted: "0.5",
};

const mockHighPriceImpact: PriceImpact = {
  tooHigh: true,
  priceImpact: 0.15,
  priceImpactFormatted: "15.0",
};

const createQuoteWithProvider = (
  provider: BridgeProvider
): SwapApprovalApiCallReturnType => ({
  ...mockSwapQuote,
  steps: {
    ...mockSwapQuote.steps,
    bridge: {
      ...mockSwapQuote.steps.bridge,
      provider,
    },
  },
});

const meta: Meta<typeof ConfirmationButton> = {
  component: ConfirmationButton,
  argTypes: {
    buttonState: {
      control: {
        type: "select",
      },
      options: [
        "notConnected",
        "readyToConfirm",
        "submitting",
        "wrongNetwork",
        "loadingQuote",
        "validationError",
        "apiError",
      ] satisfies BridgeButtonState[],
    },
    buttonDisabled: {
      control: { type: "boolean" },
    },
    buttonLoading: {
      control: { type: "boolean" },
    },
    buttonLabel: {
      control: { type: "text" },
    },
    onConfirm: {
      table: { disable: true },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 648,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexDirection: "column",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConfirmationButton>;

export const Default: Story = {
  args: {
    inputToken: mockInputToken,
    outputToken: mockOutputToken,
    amount: BigNumber.from("100000000"),
    swapQuote: mockSwapQuote,
    isQuoteLoading: false,
    buttonState: "readyToConfirm",
    buttonDisabled: false,
    buttonLoading: false,
    buttonLabel: "Confirm Swap",
    priceImpact: mockPriceImpact,
    onConfirm: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const NotConnected: Story = {
  args: {
    ...Default.args,
    swapQuote: null,
    buttonState: "notConnected",
    buttonLabel: "Connect wallet",
  },
};

export const LoadingQuote: Story = {
  args: {
    ...Default.args,
    swapQuote: null,
    buttonState: "loadingQuote",
    buttonDisabled: true,
    buttonLoading: true,
    buttonLabel: "Fetching quote...",
  },
};

export const Submitting: Story = {
  args: {
    ...Default.args,
    buttonState: "submitting",
    buttonDisabled: true,
    buttonLoading: true,
    buttonLabel: "Confirming...",
  },
};

export const WrongNetwork: Story = {
  args: {
    ...Default.args,
    buttonState: "wrongNetwork",
    buttonDisabled: true,
    buttonLabel: "Switch network",
  },
};

export const ValidationError: Story = {
  args: {
    ...Default.args,
    swapQuote: null,
    buttonState: "validationError",
    buttonDisabled: true,
    buttonLabel: "Invalid amount",
  },
};

export const ApiError: Story = {
  args: {
    ...Default.args,
    swapQuote: null,
    buttonState: "apiError",
    buttonDisabled: true,
    buttonLabel: "Failed to get quote",
  },
};

export const WithHighPriceImpact: Story = {
  args: {
    ...Default.args,
    priceImpact: mockHighPriceImpact,
  },
};

export const Expanded: Story = {
  args: {
    ...Default.args,
    initialExpanded: true,
  },
};

export const ExpandedWithHighPriceImpact: Story = {
  args: {
    ...Default.args,
    priceImpact: mockHighPriceImpact,
    initialExpanded: true,
  },
};

export const bridgeProviders = [
  "across",
  "cctp",
  "oft",
  "sponsored-intent",
  "hypercore",
] as const satisfies BridgeProvider[];

export const AllProvidersCollapsed: Story = {
  render: () => (
    <>
      {bridgeProviders.map((provider) => (
        <ConfirmationButton
          key={provider}
          inputToken={mockInputToken}
          outputToken={mockOutputToken}
          amount={BigNumber.from("100000000")}
          swapQuote={createQuoteWithProvider(provider)}
          isQuoteLoading={false}
          buttonState="readyToConfirm"
          buttonDisabled={false}
          buttonLoading={false}
          buttonLabel="Confirm Swap"
          priceImpact={mockPriceImpact}
        />
      ))}
    </>
  ),
};

export const AllProvidersExpanded: Story = {
  render: () => (
    <>
      {bridgeProviders.map((provider) => (
        <ConfirmationButton
          key={provider}
          inputToken={mockInputToken}
          outputToken={mockOutputToken}
          amount={BigNumber.from("100000000")}
          swapQuote={createQuoteWithProvider(provider)}
          isQuoteLoading={false}
          buttonState="readyToConfirm"
          buttonDisabled={false}
          buttonLoading={false}
          buttonLabel="Confirm Swap"
          priceImpact={mockPriceImpact}
          initialExpanded
        />
      ))}
    </>
  ),
};
