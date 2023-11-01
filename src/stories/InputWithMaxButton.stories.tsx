import type { Meta, StoryObj } from "@storybook/react";

import InputWithMaxButton from "../components/InputWithMaxButton";

const meta: Meta<typeof InputWithMaxButton> = {
  component: InputWithMaxButton,
};

export default meta;
type Story = StoryObj<typeof InputWithMaxButton>;

function Wrapper() {
  return (
    <InputWithMaxButton
      value="value"
      onChangeValue={() => null}
      valid
      maxValue="100"
      onEnterKeyDown={() => {}}
      onClickMaxButton={() => {}}
      invalid={false}
    />
  );
}

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */
export const Default: Story = {
  render: () => <Wrapper />,
};
