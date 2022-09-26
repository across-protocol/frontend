import { useEffect, useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SplashFlow } from "views/PreLaunchAirdrop/components/SplashFlow";
import getPrelaunchRewards from "views/PreLaunchAirdrop/api/getPrelaunchRewards";
import { RewardsApiInterface } from "utils/serverless-api/types";
import { Wrapper } from "views/PreLaunchAirdrop/PreLaunchAirdrop.styles";
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "SplashFlow",
  component: SplashFlow,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof SplashFlow>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const account = "0x1234567890123456789012345678901234567890";
const Template: ComponentStory<typeof SplashFlow> = (args) => {
  const [rewardsData, setRewardsData] = useState<RewardsApiInterface>(
    {} as RewardsApiInterface
  );
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
        displayLinkModal={() => false}
        airdropDetailsLinkHandler={() => false}
        account={account}
        rewardsData={rewardsData}
      />
    </Wrapper>
  );
};

export const Primary = Template.bind({});
