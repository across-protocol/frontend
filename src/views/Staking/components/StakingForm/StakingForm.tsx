import { useState } from "react";
import {
  Wrapper,
  Tabs,
  Tab,
  StakeInfo,
  StakeInfoItem,
  StakeInfoItemSmall,
  LightGrayItemText,
  MutliplierValue,
  StyledProgressBar,
  APYInfo,
  APYInfoItem,
  ArrowIcon,
  UsdcLogo,
} from "./StakingForm.styles";

import StakingInputBlock from "./StakingInputBlock";

type StakeTab = "stake" | "unstake";

export const StakingForm = () => {
  const [activeTab, setActiveTab] = useState<StakeTab>("stake");
  const [stakeAmount, setStakeAmount] = useState("");

  // Stub data for form
  function validateStakeAmount(amount: string) {
    return amount.length > 0;
  }

  return (
    <Wrapper>
      <Tabs>
        <Tab
          onClick={() => setActiveTab("stake")}
          active={activeTab === "stake"}
        >
          Stake
        </Tab>
        <Tab
          onClick={() => setActiveTab("unstake")}
          active={activeTab === "unstake"}
        >
          Unstake
        </Tab>
      </Tabs>
      <StakingInputBlock
        value={stakeAmount}
        setValue={setStakeAmount}
        valid={validateStakeAmount(stakeAmount)}
        buttonText={activeTab}
        Logo={UsdcLogo}
      />
      <StakeInfo>
        <StakeInfoItem>Staked LP Tokens</StakeInfoItem>
        <StakeInfoItem>
          10,000.00
          <LightGrayItemText margin={4}>/ 32,424.24 USDC-LP</LightGrayItemText>
        </StakeInfoItem>
        <StakeInfoItem>Age of capital</StakeInfoItem>
        <StakeInfoItem>50 days</StakeInfoItem>
        <StakeInfoItem>Multiplier</StakeInfoItem>
        <StakeInfoItem>
          <MutliplierValue>
            <StyledProgressBar percent={50} />
            1.5x
          </MutliplierValue>
        </StakeInfoItem>
        <StakeInfoItemSmall>
          Note: Multipliers of previously staked tokens are not impacted
        </StakeInfoItemSmall>
      </StakeInfo>
      <APYInfo>
        <APYInfoItem>
          <ArrowIcon />
          Your total APY
        </APYInfoItem>
        <APYInfoItem>2.81%</APYInfoItem>
      </APYInfo>
    </Wrapper>
  );
};

export default StakingForm;
