import { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import TravellerFlow from "views/PreLaunchAirdrop/components/TravellerFlow";
import { FlowSelector } from "views/PreLaunchAirdrop/usePreLaunchAirdrop";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "TravellerFlow",
  component: TravellerFlow,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof TravellerFlow>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof TravellerFlow> = (args) => {
  const [_, setActivePageFlow] = useState<FlowSelector>("traveller");

  return <TravellerFlow setActivePageFlow={setActivePageFlow} />;
};

export const Primary = Template.bind({});
