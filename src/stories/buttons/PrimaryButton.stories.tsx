import type { Meta, StoryObj } from "@storybook/react";

import { PrimaryButton } from "../../components/Button";

const meta: Meta<typeof PrimaryButton> = {
  component: PrimaryButton,
  argTypes: {
    backgroundColor: {
      control: {
        type: "select",
      },
    },
    textColor: {
      control: {
        type: "select",
      },
    },
    size: {
      control: {
        type: "radio",
        options: ["lg", "md", "sm"],
      },
    },
    disabled: {
      control: {
        type: "boolean",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PrimaryButton>;

export const Primary: Story = {
  render: (args) => <PrimaryButton {...args}>Primary Button</PrimaryButton>,
};
