import type { Meta, StoryObj } from "@storybook/react";
import { BigNumber } from "ethers";
import { ConfirmationButton } from "./ConfirmationButton";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { SwapApprovalApiCallReturnType } from "../../../../utils/serverless-api/prod/swap-approval";
import { QuoteRequestProvider } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { QuoteRequest } from "../../hooks/useQuoteRequest/quoteRequestAction";
import { BridgeProvider } from "../../utils/bridgeProvider";

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

const mockQuoteRequest: QuoteRequest = {
  tradeType: "exactInput",
  originToken: mockInputToken,
  destinationToken: mockOutputToken,
  customDestinationAccount: null,
  amount: BigNumber.from("100000000"),
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
  title: "Stories/ConfirmationButton",
  argTypes: {
    isQuoteLoading: {
      control: { type: "boolean" },
    },
    initialExpanded: {
      control: { type: "boolean" },
    },
    onConfirm: {
      table: { disable: true },
    },
  },
  decorators: [
    (Story) => (
      <QuoteRequestProvider initialQuoteRequest={mockQuoteRequest}>
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
      </QuoteRequestProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConfirmationButton>;

export const Default: Story = {
  args: {
    swapQuote: mockSwapQuote,
    isQuoteLoading: false,
    quoteError: null,
    onConfirm: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const NoQuote: Story = {
  args: {
    swapQuote: undefined,
    isQuoteLoading: false,
    quoteError: null,
  },
};

export const LoadingQuote: Story = {
  args: {
    swapQuote: undefined,
    isQuoteLoading: true,
    quoteError: null,
  },
};

export const WithError: Story = {
  args: {
    swapQuote: undefined,
    isQuoteLoading: false,
    quoteError: new Error("Failed to fetch quote"),
  },
};

export const Expanded: Story = {
  args: {
    ...Default.args,
    initialExpanded: true,
  },
};

const highPriceImpactQuote: SwapApprovalApiCallReturnType = {
  ...mockSwapQuote,
  fees: {
    ...mockSwapQuote.fees!,
    total: {
      ...mockSwapQuote.fees!.total,
      pct: BigNumber.from("150000000000000000"), // 15% - above 10% threshold
    },
  },
};

export const HighPriceImpact: Story = {
  args: {
    swapQuote: highPriceImpactQuote,
    isQuoteLoading: false,
    quoteError: null,
  },
};

export const HighPriceImpactExpanded: Story = {
  args: {
    swapQuote: highPriceImpactQuote,
    isQuoteLoading: false,
    quoteError: null,
    initialExpanded: true,
  },
};

const bridgeProviders = [
  "across",
  "cctp",
  "oft",
  "sponsored-intent",
  "sponsored-oft",
  "sponsored-cctp",
  "hypercore",
] as const satisfies BridgeProvider[];

export const AllProvidersCollapsed: Story = {
  render: () => (
    <QuoteRequestProvider initialQuoteRequest={mockQuoteRequest}>
      {bridgeProviders.map((provider) => (
        <>
          <h1>{provider}</h1>
          <ConfirmationButton
            key={provider}
            swapQuote={createQuoteWithProvider(provider)}
            isQuoteLoading={false}
            quoteError={null}
          />
        </>
      ))}
    </QuoteRequestProvider>
  ),
};

export const AllProvidersExpanded: Story = {
  render: () => (
    <QuoteRequestProvider initialQuoteRequest={mockQuoteRequest}>
      {bridgeProviders.map((provider) => (
        <>
          <h1>{provider}</h1>
          <ConfirmationButton
            key={provider}
            swapQuote={createQuoteWithProvider(provider)}
            isQuoteLoading={false}
            quoteError={null}
            initialExpanded
          />
        </>
      ))}
    </QuoteRequestProvider>
  ),
};
