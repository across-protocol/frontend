import { ComponentStory, ComponentMeta } from "@storybook/react";

import TravellerFlow from "views/PreLaunchAirdrop/components/TravellerFlow";

export default {
  title: "TravellerFlow",
  component: TravellerFlow,
  argTypes: {
    account: {
      type: "string",
    },
    setActivePageFlow: {
      type: "function",
    },
  },
} as ComponentMeta<typeof TravellerFlow>;

const Template: ComponentStory<typeof TravellerFlow> = (args) => {
  const account = "0x1234567890123456789012345678901234567890";
  return <TravellerFlow switchToSplash={() => {}} account={account} />;
};

export const Primary = Template.bind({});
