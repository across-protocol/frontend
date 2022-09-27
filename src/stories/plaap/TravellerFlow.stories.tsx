import { ComponentStory, ComponentMeta } from "@storybook/react";

import TravellerFlow from "views/PreLaunchAirdrop/components/TravellerFlow";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TravellerFlow",
  component: TravellerFlow,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    account: {
      type: "string",
    },
    setActivePageFlow: {
      type: "function",
    },
  },
} as ComponentMeta<typeof TravellerFlow>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TravellerFlow> = (args) => {
  const account = "0x1234567890123456789012345678901234567890";
  return <TravellerFlow account={account} />;
};

export const Primary = Template.bind({});
