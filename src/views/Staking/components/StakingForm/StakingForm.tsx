import { useState } from "react";

import {
  Wrapper,
  Tabs,
  Tab,
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  StakeInfo,
  StakeInfoItem,
  StakeInfoItemSmall,
  LightGrayItemText,
  MutliplierValue,
  StyledProgressBar,
} from "./StakingForm.styles";
import { capitalizeFirstLetter } from "utils/format";

type StakeTab = "stake" | "unstake";

export const StakingForm = () => {
  const [activeTab, setActiveTab] = useState<StakeTab>("stake");
  const [stakeAmount, setStakeAmount] = useState("");
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
      <InputRow>
        <InputWrapper>
          <Input
            placeholder="Enter amount"
            value={stakeAmount}
            type="text"
            onChange={(e) => setStakeAmount(e.target.value)}
          />
        </InputWrapper>
        <ButtonWrapper>
          <StakeButton>{capitalizeFirstLetter(activeTab)}</StakeButton>
        </ButtonWrapper>
      </InputRow>
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
          <StyledProgressBar percent={50} />
          <MutliplierValue>1.5x</MutliplierValue>
        </StakeInfoItem>
        <StakeInfoItemSmall>
          Note: Multipliers of previously staked tokens are not impacted
        </StakeInfoItemSmall>
      </StakeInfo>
    </Wrapper>
  );
};

export default StakingForm;
