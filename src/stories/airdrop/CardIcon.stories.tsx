import { ComponentStory, ComponentMeta } from "@storybook/react";
import CardIcon from "views/PreLaunchAirdrop/components/CardIcon";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "PLAAP/CardIcon",
  component: CardIcon,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof CardIcon>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof CardIcon> = (args) => (
  <CardIcon {...args} />
);

export const NoCheckMark = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
NoCheckMark.args = {
  checkIconState: undefined,
  Icon: IIcon,
};

export const Ineligible = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Ineligible.args = {
  checkIconState: "ineligible",
  Icon: IIcon,
};

export const Eligible = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Eligible.args = {
  checkIconState: "eligible",
  Icon: IIcon,
};

export const Undetermined = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Undetermined.args = {
  checkIconState: "undetermined",
  Icon: IIcon,
};
