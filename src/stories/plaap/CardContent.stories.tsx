import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";
import AirdropCard from "views/PreLaunchAirdrop/components/AirdropCard";
import AirdropButtonGroup from "views/PreLaunchAirdrop/components/content/AirdropButtonGroup";
import CardStepper from "views/PreLaunchAirdrop/components/content/CardStepper";
import CardTextDescription from "views/PreLaunchAirdrop/components/content/CardTextDescription";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "PLAAP/AirdropCard",
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
  <AirdropCard {...args}>{args.children}</AirdropCard>
);

export const CheckMark = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
CheckMark.args = {
  check: "eligible",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
};

export const WithDescription = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
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

export const WithButtonGroup = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
WithButtonGroup.args = {
  check: "ineligible",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
  contentStackChildren: (
    <AirdropButtonGroup
      left={{ link: "/", text: "Learn about Across" }}
      right={{ link: "/", text: "Disconnect wallet" }}
    />
  ),
};

export const WithSingleButtonGroup = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
WithSingleButtonGroup.args = {
  check: "ineligible",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
  contentStackChildren: (
    <AirdropButtonGroup left={{ link: "/", text: "Learn about Across" }} />
  ),
};

export const WithStepper = Template.bind({});
WithStepper.args = {
  check: "undetermined",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
  children: (
    <CardStepper
      steps={[
        {
          buttonContent: <>Connect Discord</>,
          buttonHandler: () => {},
          stepProgress: "awaiting",
          stepTitle: "Connect Discord",
          stepIcon: <WalletIcon />,
        },
        {
          buttonContent: <>Link +</>,
          buttonHandler: () => {},
          stepProgress: "awaiting",
          stepTitle: "Link to Ethereum wallet",
        },
      ]}
    />
  ),
};

export const WithStepperWaiting = Template.bind({});
WithStepperWaiting.args = {
  check: "ineligible",
  Icon: IIcon,
  description:
    "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.",
  title: "Bridge Traveler Program",
  externalLink: undefined,
  children: (
    <CardStepper
      steps={[
        {
          buttonContent: <>Disconnect Discord</>,
          buttonHandler: () => {},
          stepProgress: "failed",
          stepTitle: "sumfella.eth | RL...",
          completedText: "Ineligible account",
          stepIcon: <WalletIcon />,
        },
        {
          buttonContent: <>Link +</>,
          buttonHandler: () => {},
          stepProgress: "awaiting",
          stepTitle: "Link to Ethereum Wallet",
        },
      ]}
    />
  ),
};
