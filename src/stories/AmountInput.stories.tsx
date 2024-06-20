import { useState } from "react";
import { BigNumber } from "ethers";
import type { Meta, StoryObj } from "@storybook/react";

import { AmountInput } from "../components/AmountInput";

const meta: Meta<typeof AmountInput> = {
  component: AmountInput,
  argTypes: {
    onChangeAmountInput: {
      table: {
        disable: true,
      },
    },
    onClickMaxBalance: {
      table: {
        disable: true,
      },
    },
    inputTokenSymbol: {
      table: {
        disable: true,
      },
    },
    amountInput: {
      table: {
        disable: true,
      },
    },
    balance: {
      table: {
        disable: true,
      },
    },
    disableInput: {
      control: {
        type: "boolean",
      },
    },
    disableMaxButton: {
      control: {
        type: "boolean",
      },
    },
    displayTokenIcon: {
      control: {
        type: "boolean",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AmountInput>;

function Wrapper(props: typeof meta.args) {
  const {
    inputTokenSymbol = "ETH",
    balance = BigNumber.from(100),
    ...restProps
  } = props || {};
  const [input, setInput] = useState("");
  return (
    <AmountInput
      amountInput={input}
      balance={balance}
      onChangeAmountInput={setInput}
      onClickMaxBalance={() => {
        setInput(String(balance));
      }}
      inputTokenSymbol={inputTokenSymbol}
      {...restProps}
    />
  );
}

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Default: Story = {
  render: (args) => <Wrapper {...args} />,
};
