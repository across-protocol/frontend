import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SecondaryButtonV2 } from "components/Buttons/ButtonV2";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "SecondaryButtonV2",
  component: SecondaryButtonV2,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof SecondaryButtonV2>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof SecondaryButtonV2> = (args) => (
  <SecondaryButtonV2 {...args}>{args.children}</SecondaryButtonV2>
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
