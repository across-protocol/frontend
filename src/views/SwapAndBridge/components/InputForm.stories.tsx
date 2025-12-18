import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { BigNumber } from "ethers";
import { InputForm } from "./InputForm";
import { EnrichedToken } from "./ChainTokenSelector/ChainTokenSelectorModal";
import { QuoteRequestProvider } from "../hooks/useQuoteRequest/QuoteRequestContext";
import { QuoteRequest } from "../hooks/useQuoteRequest/quoteRequestAction";

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

const mockQuoteRequest: QuoteRequest = {
  tradeType: "exactInput",
  originToken: mockInputToken,
  destinationToken: mockOutputToken,
  customDestinationAccount: null,
  amount: BigNumber.from("100000000"),
};

const mockQuoteRequestNoTokens: QuoteRequest = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  customDestinationAccount: null,
  amount: null,
};

const mockQuoteRequestMinOutput: QuoteRequest = {
  tradeType: "minOutput",
  originToken: mockInputToken,
  destinationToken: mockOutputToken,
  customDestinationAccount: null,
  amount: BigNumber.from("99500000"),
};

const meta: Meta<typeof InputForm> = {
  component: InputForm,
  title: "Bridge/InputForm",
  argTypes: {
    isQuoteLoading: {
      control: { type: "boolean" },
    },
  },
  decorators: [
    (Story, context) => (
      <QuoteRequestProvider
        initialQuoteRequest={
          context.parameters.quoteRequest ?? mockQuoteRequest
        }
      >
        <div
          style={{
            maxWidth: 600,
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
type Story = StoryObj<typeof InputForm>;

export const Default: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: undefined,
    expectedOutputAmount: BigNumber.from("99500000"),
  },
};

export const Loading: Story = {
  args: {
    isQuoteLoading: true,
    expectedInputAmount: undefined,
    expectedOutputAmount: undefined,
  },
};

export const WithQuoteResult: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: undefined,
    expectedOutputAmount: BigNumber.from("99500000"),
  },
};

export const MinOutputMode: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: BigNumber.from("100500000"),
    expectedOutputAmount: undefined,
  },
  parameters: {
    quoteRequest: mockQuoteRequestMinOutput,
  },
};

export const NoTokensSelected: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: undefined,
    expectedOutputAmount: undefined,
  },
  parameters: {
    quoteRequest: mockQuoteRequestNoTokens,
  },
};

export const LargeAmount: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: undefined,
    expectedOutputAmount: BigNumber.from("1234567890123"),
  },
  parameters: {
    quoteRequest: {
      ...mockQuoteRequest,
      amount: BigNumber.from("1234567890123"),
    },
  },
};

const mockQuoteRequestEmpty: QuoteRequest = {
  tradeType: "exactInput",
  originToken: mockInputToken,
  destinationToken: mockOutputToken,
  customDestinationAccount: null,
  amount: null,
};

export const ThousandSeparatorTest: Story = {
  args: {
    isQuoteLoading: false,
    expectedInputAmount: undefined,
    expectedOutputAmount: undefined,
  },
  parameters: {
    quoteRequest: mockQuoteRequestEmpty,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const originInput = canvas.getByTestId("bridge-amount-input");

    await userEvent.clear(originInput);
    await userEvent.type(originInput, "1234567.89", { delay: 50 });
  },
};
