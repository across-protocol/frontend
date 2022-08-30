import { useEffect, useState } from "react";
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
  Divider,
  InputBlockWrapper,
  StakeInfoRow,
  StakeAPYInfoRow,
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
          valid={!isConnected || validateStakeAmount(stakeAmount)}
          buttonText={`${buttonTextPrefix} ${activeTab}`}
          Logo={UsdcLogo}
          maxValue={buttonMaxValue}
          omitInput={!isConnected}
          onClickHandler={buttonHandler}
        />
      </InputBlockWrapper>
      <Divider />
      <StakeInfo>
        <StakeInfoRow>
          <StakeInfoItem>Staked LP Tokens</StakeInfoItem>
          <StakeInfoItem>
            {valueOrEmpty(
              <div>
                <LightGrayItemText margin={4}>
                  {formatEther(userCumulativeStake)} /
                </LightGrayItemText>
                {formatEther(usersTotalLPTokens)} {lpTokenName}
              </div>
            )}
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
            {valueOrEmpty(
              <>
                {ageOfCapital <= 0
                  ? "-"
                  : `${formatNumberMaxFracDigits(ageOfCapital)} Days`}
              </>
            )}
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
            {valueOrEmpty(
              <MutliplierValue>
                <StyledProgressBar percent={usersMultiplierPercentage} />
                {formatEther(currentMultiplier)} x
              </MutliplierValue>
            )}
          </StakeInfoItem>
        </StakeInfoRow>
        <StakeInfoRow>
          <StakeInfoItemSmall>
            Note: Multipliers of previously staked tokens are not impacted
          </StakeInfoItemSmall>
        </StakeInfoRow>
        <Divider />
        <StakeAPYInfoRow>
          <StakeInfoItem>
            <APYInfoItem>
              <ArrowIcon />
              Your total APY
            </APYInfoItem>
          </StakeInfoItem>
          <StakeInfoItem>
            {valueOrEmpty(<LightGrayItemText>2.81%</LightGrayItemText>)}
          </StakeInfoItem>
        </StakeAPYInfoRow>
      </StakeInfo>
    </Card>
  );
};

export default StakingForm;
