import { ComponentStory, ComponentMeta } from "@storybook/react";
import { TitleSection } from "views/PreLaunchAirdrop/components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "PLAAP/TitleSegment",
  component: TitleSection,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof TitleSection>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TitleSection> = (args) => (
  <TitleSection {...args} />
);

export const NotConnnected = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
NotConnnected.args = {
  isConnected: false,
};

export const Connnected = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
NotConnnected.args = {
  isConnected: true,
};
