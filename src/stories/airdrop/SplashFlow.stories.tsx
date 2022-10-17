import { useEffect, useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SplashFlow } from "views/Airdrop/components/SplashFlow";
import getPrelaunchRewards from "views/PreLaunchAirdrop/api/getPrelaunchRewards";
import { RewardsApiInterface } from "utils/serverless-api/types";
import { Wrapper } from "views/Airdrop/Airdrop.styles";
import { FlowSelector } from "views/Airdrop/hooks/useAirdrop";

export default {
  title: "SplashFlow",
  component: SplashFlow,
  argTypes: {},
} as ComponentMeta<typeof SplashFlow>;

const account = "0x1234567890123456789012345678901234567890";
const Template: ComponentStory<typeof SplashFlow> = (args) => {
  const [rewardsData, setRewardsData] = useState<RewardsApiInterface>(
    {} as RewardsApiInterface
  );
  const [, setActivePageFlow] = useState<FlowSelector>("traveller");
  useEffect(() => {
    getPrelaunchRewards(account).then((res) => {
      if (res) {
        setRewardsData(res);
      }
    });
  }, []);
  return (
    <Wrapper>
      <SplashFlow
        isConnected={true}
        isDiscordAuthenticated={true}
        connectWalletHandler={() => false}
        discordLoginHandler={() => false}
        discordLogoutHandler={() => false}
        linkWalletHandler={async () => false}
        airdropDetailsLinkHandler={() => false}
        account={account}
        rewardsData={rewardsData}
        discordDetailsError={false}
        setActivePageFlow={setActivePageFlow}
      />
    </Wrapper>
  );
};

export const Primary = Template.bind({});
