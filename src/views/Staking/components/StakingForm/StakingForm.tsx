import { useState } from "react";
import {
  Card,
  Tabs,
  Tab,
  StakeInfo,
  StakeInfoItem,
  StakeInfoItemSmall,
  LightGrayItemText,
  MutliplierValue,
  StyledProgressBar,
  APYInfoItem,
  ArrowIcon,
  UsdcLogo,
  InfoIcon,
  InputBlockWrapper,
  Divider,
  StakeInfoRow,
  StakeAPYInfoRow,
} from "./StakingForm.styles";

import { PopperTooltip } from "components/Tooltip";
import StakingInputBlock from "../StakingInputBlock";

type StakeTab = "stake" | "unstake";

export const StakingForm = () => {
  const [activeTab, setActiveTab] = useState<StakeTab>("stake");
  const [stakeAmount, setStakeAmount] = useState("");

  // Stub data for form
  function validateStakeAmount(amount: string) {
    return amount.length > 0;
  }

  return (
    <Card>
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
      <InputBlockWrapper>
        <StakingInputBlock
          value={stakeAmount}
          setValue={setStakeAmount}
          valid={validateStakeAmount(stakeAmount)}
          buttonText={activeTab}
          Logo={UsdcLogo}
          maxValue="0"
        />
      </InputBlockWrapper>
      <Divider />

      <StakeInfo>
        <StakeInfoRow>
          <StakeInfoItem>Staked LP Tokens</StakeInfoItem>
          <StakeInfoItem>
            <div>
              <LightGrayItemText margin={4}>10,000.00 /</LightGrayItemText>
              32,424.24 USDC-LP
            </div>
          </StakeInfoItem>
        </StakeInfoRow>
        <StakeInfoRow>
          <StakeInfoItem>
            Age of capital
            <PopperTooltip
              title="Age of capital"
              body="The age of capital is the time since the last time you staked LP tokens."
              placement="bottom-start"
            >
              <InfoIcon />
            </PopperTooltip>
          </StakeInfoItem>
          <StakeInfoItem>
            <LightGrayItemText>50 days</LightGrayItemText>
          </StakeInfoItem>
        </StakeInfoRow>
        <StakeInfoRow>
          <StakeInfoItem>
            Multiplier
            <PopperTooltip
              title="Multiplier"
              body="The multiplier is the amount of LP tokens you get for staking."
              placement="bottom-start"
            >
              <InfoIcon />
            </PopperTooltip>
          </StakeInfoItem>
          <StakeInfoItem>
            <MutliplierValue>
              <StyledProgressBar percent={75} />
              2.00x
            </MutliplierValue>
          </StakeInfoItem>
        </StakeInfoRow>
        <StakeInfoRow>
          <StakeInfoItem>
            <StakeInfoItemSmall>
              Note: Multipliers of previously staked tokens are not impacted
            </StakeInfoItemSmall>
          </StakeInfoItem>
        </StakeInfoRow>
        <StakeInfoRow>
          <Divider />
        </StakeInfoRow>
        <StakeAPYInfoRow>
          <StakeInfoItem>
            <APYInfoItem>
              <ArrowIcon />
              Your total APY
            </APYInfoItem>
          </StakeInfoItem>
          <StakeInfoItem>
            <LightGrayItemText>2.81%</LightGrayItemText>
          </StakeInfoItem>
        </StakeAPYInfoRow>
      </StakeInfo>
    </Card>
  );
};

export default StakingForm;
