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
} from "./StakingForm.styles";
export const StakingForm = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stakeAmount, setStakeAmount] = useState("");
  return (
    <Wrapper>
      <Tabs>
        <Tab onClick={() => setActiveTab(0)} active={activeTab === 0}>
          Stake
        </Tab>
        <Tab onClick={() => setActiveTab(1)} active={activeTab === 1}>
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
          <StakeButton>Stake</StakeButton>
        </ButtonWrapper>
      </InputRow>
    </Wrapper>
  );
};

export default StakingForm;
