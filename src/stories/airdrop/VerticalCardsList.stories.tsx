import { ComponentStory, ComponentMeta } from "@storybook/react";

import InfoCard from "views/Airdrop/components/InfoCard";
import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as EarlyBridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as BridgeTravelerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as LPIcon } from "assets/icons/plaap/money.svg";

import { VerticalCardsList } from "views/Airdrop/components/VerticalCardsList";

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
    <InfoCard
      Icon={<DiscordIcon />}
      acxTokenAmount="20,000,000"
      title="Community Member"
      description="Community members who have meaningfully contributed to Across
    prior to the community snapshot (September 1, 2022). This
    includes a discord role-based allocation as well as a bonus
    allocation for many community members who went above and beyond."
    />,
    <InfoCard
      Icon={<BridgeTravelerIcon />}
      acxTokenAmount="10,000,000 - 20,000,000"
      title="Bridge Traveler Program"
      description="Active bridge users identified by the Bridge Traveler program
    who have not used Across prior to September 1, 2022. These users
    need to complete a bridge transfer on Across ahead of the ACX
    token launch to become eligible. The amount of ACX initially
    committed to this program is 10MM, but this amount will double
    to 20MM if a participation rate of 30% or more is achieved.
    Users who complete a bridge transfer will share these tokens
    with some allocation variability depending on past bridge
    activity."
    />,
    <InfoCard
      Icon={<EarlyBridgeIcon />}
      acxTokenAmount="15,000,000"
      title="Early Bridge User"
      description="Users who bridged assets before the Across Referral Program
    (July 18th, 2022). These tokens will be allocated to wallets
    pro-rata by the volume of transfer completed. A minimum transfer
    amount is required and a maximum airdrop size will be applied."
    />,
    <InfoCard
      Icon={<LPIcon />}
      acxTokenAmount="70,000,000"
      title="Liquidity Provider"
      description="Liquidity providers who pool ETH, USDC, WBTC or DAI into the
    Across protocol before the token launch. The amount of rewards
    to LPs are pro-rated by size and a fixed amount of tokens will
    be emitted at each block since the inception of the protocol."
    />,
  ],
};
