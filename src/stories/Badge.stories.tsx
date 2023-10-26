import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../components/Badge";

const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    borderColor: {
      control: {
        type: "select",
      },
    },
    textColor: {
      control: {
        type: "select",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const DefaultBadge: Story = {
  render: (args) => (
    <>
      <Badge {...args}>1 / 2</Badge>
    </>
  ),
};
