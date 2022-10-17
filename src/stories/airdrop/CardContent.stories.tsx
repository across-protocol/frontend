import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";
import AirdropCard from "views/Airdrop/components/AirdropCard";
import CardTextDescription from "views/Airdrop/components/CardTextDescription";

export default {
  title: "airdrop/AirdropCard",
  component: AirdropCard,
  argTypes: {},
  parameters: {
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#2d2e33" }],
    },
  },
} as ComponentMeta<typeof AirdropCard>;

const Template: ComponentStory<typeof AirdropCard> = (args) => (
  <AirdropCard {...args}>{args.children}</AirdropCard>
);

export const CheckMark = Template.bind({});
CheckMark.args = {
  check: "eligible",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
};

export const WithDescription = Template.bind({});
WithDescription.args = {
  check: undefined,
  Icon: IIcon,
  acxTokenAmount: "25,000,000",
  title: "Bridge Traveler Program",
  externalLink: undefined,
  children: (
    <CardTextDescription>
      Significant contributor to the project which may include Discord members
      with Co-founder, Early Recruit, DAO Contributor or Senior DAO Contributor
      status.
    </CardTextDescription>
  ),
};
