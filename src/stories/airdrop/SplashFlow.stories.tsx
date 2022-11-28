import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SplashFlow } from "views/Airdrop/components/SplashFlow";
import { Wrapper } from "views/Airdrop/Airdrop.styles";

export default {
  title: "airdrop/SplashFlow",
  component: SplashFlow,
  argTypes: {},
} as ComponentMeta<typeof SplashFlow>;

const Template: ComponentStory<typeof SplashFlow> = (args) => {
  return (
    <Wrapper>
      <SplashFlow
        connectWalletHandler={() => false}
        airdropDetailsLinkHandler={() => false}
      />
    </Wrapper>
  );
};

export const Primary = Template.bind({});
