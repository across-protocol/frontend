import { ComponentStory, ComponentMeta } from "@storybook/react";
import CardIcon from "views/Airdrop/components/CardIcon";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";

export default {
  title: "airdrop/CardIcon",
  component: CardIcon,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof CardIcon>;

const Template: ComponentStory<typeof CardIcon> = (args) => (
  <CardIcon {...args} />
);

export const NoCheckMark = Template.bind({});
NoCheckMark.args = {
  checkIconState: undefined,
  Icon: IIcon,
};

export const Ineligible = Template.bind({});
Ineligible.args = {
  checkIconState: "ineligible",
  Icon: IIcon,
};

export const Eligible = Template.bind({});
Eligible.args = {
  checkIconState: "eligible",
  Icon: IIcon,
};

export const Undetermined = Template.bind({});
Undetermined.args = {
  checkIconState: "undetermined",
  Icon: IIcon,
};
