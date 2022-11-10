import { ComponentStory, ComponentMeta } from "@storybook/react";

import { NotEligibleWalletFlow } from "views/Airdrop/components/NotEligibleWalletFlow";
import { Wrapper } from "views/Airdrop/Airdrop.styles";

export default {
  title: "airdrop/NotEligibleWalletFlow",
  component: NotEligibleWalletFlow,
  argTypes: {},
} as ComponentMeta<typeof NotEligibleWalletFlow>;

const Template: ComponentStory<typeof NotEligibleWalletFlow> = (args) => {
  return (
    <Wrapper>
      <NotEligibleWalletFlow onClickInfoLink={() => {}} />
    </Wrapper>
  );
};

export const Primary = Template.bind({});
