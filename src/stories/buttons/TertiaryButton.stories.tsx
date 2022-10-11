import { ComponentStory, ComponentMeta } from "@storybook/react";

import { TertiaryButton } from "components/Buttons/ButtonV2";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TertiaryButton",
  component: TertiaryButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof TertiaryButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TertiaryButton> = (args) => (
  <TertiaryButton {...args}>{args.children}</TertiaryButton>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  size: "md",
  children: "Submit",
};

export const Large = Template.bind({});
Large.args = {
  size: "lg",
  children: "Submit",
};

export const Small = Template.bind({});
Small.args = {
  size: "sm",
  children: "Submit",
};
