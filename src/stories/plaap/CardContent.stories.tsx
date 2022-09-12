import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";
import AirdropCard from "views/PreLaunchAirdrop/components/AirdropCard";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "PLAAP/CardIcon",
  component: AirdropCard,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof AirdropCard>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof AirdropCard> = (args) => (
  <AirdropCard {...args} />
);

export const NoCheckMark = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
NoCheckMark.args = {
  check: undefined,
  Icon: IIcon,
  description: "Example",
  title: "Title Example",
  externalLink: undefined,
};
