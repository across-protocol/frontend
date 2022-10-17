import { ComponentStory, ComponentMeta } from "@storybook/react";
import TitleSection from "views/Airdrop/components/TitleSection";

export default {
  title: "airdrop/TitleSegment",
  component: TitleSection,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof TitleSection>;

const Template: ComponentStory<typeof TitleSection> = (args) => (
  <TitleSection {...args} />
);

export const NotConnnected = Template.bind({});
NotConnnected.args = {
  isConnected: false,
};

export const Connnected = Template.bind({});
NotConnnected.args = {
  isConnected: true,
};
