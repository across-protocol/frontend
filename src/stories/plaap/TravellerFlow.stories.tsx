import { ComponentStory, ComponentMeta } from "@storybook/react";

import TravellerFlow from "views/PreLaunchAirdrop/components/TravellerFlow";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TravellerFlow",
  component: TravellerFlow,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof TravellerFlow>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TravellerFlow> = (args) => (
  <TravellerFlow />
);

export const Primary = Template.bind({});
