import { ComponentStory, ComponentMeta } from "@storybook/react";

import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";
import AirdropCard from "views/PreLaunchAirdrop/components/AirdropCard";
import CardTextDescription from "views/PreLaunchAirdrop/components/content/CardTextDescription";

import { VerticalCardsList } from "views/PreLaunchAirdrop/components/VerticalCardsList";

export default {
  title: "PLAAP/VerticalCardsList",
  component: VerticalCardsList,
  argTypes: {},
} as ComponentMeta<typeof VerticalCardsList>;

const Template: ComponentStory<typeof VerticalCardsList> = (args) => (
  <div style={{ width: "100%", height: "100%" }}>
    <VerticalCardsList {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  cards: [
    <AirdropCard
      Icon={IIcon}
      acxTokenAmount="25,000,000"
      title="Community Member"
      hideBoxShadow
    >
      <CardTextDescription>
        Significant contributor to the project which may include Discord members
        with Co-founder, Early Recruit, DAO Contributor or Senior DAO
        Contributor status.
      </CardTextDescription>
    </AirdropCard>,
    <AirdropCard
      Icon={IIcon}
      acxTokenAmount="10,000,000 - 20,000,000"
      title="Across Community Member"
      hideBoxShadow
    >
      <CardTextDescription>
        Significant contributor to the project which may include Discord members
        with Co-founder, Early Recruit, DAO Contributor or Senior DAO
        Contributor status.
      </CardTextDescription>
    </AirdropCard>,
    <AirdropCard
      Icon={IIcon}
      acxTokenAmount="15,000,000"
      title="Early Bridge User"
      hideBoxShadow
    >
      <CardTextDescription>
        Significant contributor to the project which may include Discord members
        with Co-founder, Early Recruit, DAO Contributor or Senior DAO
        Contributor status.
      </CardTextDescription>
    </AirdropCard>,
    <AirdropCard
      Icon={IIcon}
      acxTokenAmount="70,000,000"
      title="Liquidity Provider"
      hideBoxShadow
    >
      <CardTextDescription>
        Significant contributor to the project which may include Discord members
        with Co-founder, Early Recruit, DAO Contributor or Senior DAO
        Contributor status.
      </CardTextDescription>
    </AirdropCard>,
  ],
};
