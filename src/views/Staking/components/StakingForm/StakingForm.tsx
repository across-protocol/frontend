import { useEffect, useState } from "react";
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
  InfoIcon,
  InputBlockWrapper,
} from "./StakingForm.styles";

import { PopperTooltip } from "components/Tooltip";
import StakingInputBlock from "../StakingInputBlock";
import { StakingFormPropType } from "../../types";
import { repeatableTernaryBuilder } from "utils/ternary";
import { formatEther, formatNumberMaxFracDigits } from "utils";

type StakeTab = "stake" | "unstake";

export const StakingForm = ({
  isConnected,
  walletConnectionHandler,
  userCumulativeStake,
  lpTokenName,
  currentMultiplier,
  usersMultiplierPercentage,
  usersTotalLPTokens,
  ageOfCapital,
  availableLPTokenBalance,
}: StakingFormPropType) => {
  const [activeTab, setActiveTab] = useState<StakeTab>("stake");
  const [stakeAmount, setStakeAmount] = useState("");

  const buttonHandler = isConnected ? () => {} : walletConnectionHandler;
  const buttonTextPrefix = isConnected ? "" : "Connect wallet to ";
  const buttonMaxValue = formatEther(
    activeTab === "stake" ? availableLPTokenBalance : userCumulativeStake
  );

  // Stub data for form
  function validateStakeAmount(amount: string) {
    return amount.length > 0;
  }

  const valueOrEmpty = repeatableTernaryBuilder(isConnected, <>-</>);

  useEffect(() => {
    setStakeAmount("");
  }, [activeTab]);

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
      <InputBlockWrapper>
        <StakingInputBlock
          value={stakeAmount}
          setValue={setStakeAmount}
          valid={!isConnected || validateStakeAmount(stakeAmount)}
          buttonText={`${buttonTextPrefix} ${activeTab}`}
          Logo={UsdcLogo}
          maxValue={buttonMaxValue}
          omitInput={!isConnected}
          onClickHandler={buttonHandler}
        />
      </InputBlockWrapper>
      <StakeInfo>
        <StakeInfoItem>Staked LP Tokens</StakeInfoItem>
        <StakeInfoItem>
          {valueOrEmpty(
            <div>
              {formatEther(userCumulativeStake)}
              <LightGrayItemText margin={4}>
                / {formatEther(usersTotalLPTokens)} {lpTokenName}
              </LightGrayItemText>
            </div>
          )}
        </StakeInfoItem>
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
          {valueOrEmpty(
            <>
              {ageOfCapital <= 0
                ? "-"
                : `${formatNumberMaxFracDigits(ageOfCapital)} Days`}
            </>
          )}
        </StakeInfoItem>
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
          {valueOrEmpty(
            <MutliplierValue>
              <StyledProgressBar percent={usersMultiplierPercentage} />
              {formatEther(currentMultiplier)} x
            </MutliplierValue>
          )}
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
        <APYInfoItem>{valueOrEmpty(<>2.81%</>)}</APYInfoItem>
      </APYInfo>
    </Wrapper>
  );
};

export default StakingForm;
