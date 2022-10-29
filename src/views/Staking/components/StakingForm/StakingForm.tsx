import { useEffect, useState } from "react";
import {
  Card,
  Tabs,
  Tab,
  StakeInfo,
  StakeInfoItem,
  StyledProgressBar,
  APYInfoItem,
  InfoIcon,
  Divider,
  InputBlockWrapper,
  StakeInfoRow,
  StakeAPYInfoRow,
  InnerPoolStakeInfo,
  ArrowIconUp,
  ArrowIconDown,
} from "./StakingForm.styles";

import { PopperTooltip } from "components/Tooltip";
import StakingInputBlock from "../StakingInputBlock";
import { StakingFormPropType } from "../../types";
import { repeatableTernaryBuilder } from "utils/ternary";
import {
  formatEther,
  formatNumberMaxFracDigits,
  isNumericWithinRange,
} from "utils";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { Text } from "components/Text";

type StakeTab = "stake" | "unstake";

export const StakingForm = ({
  isConnected,
  walletConnectionHandler,
  stakeActionFn,
  unstakeActionFn,
  isWrongNetwork,
  isDataLoading,
  isMutating,
  poolData,
  logoURI,
}: StakingFormPropType) => {
  const [activeTab, setActiveTab] = useState<StakeTab>("stake");
  const [isPoolInfoVisible, setIsPoolInfoVisible] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");

  const buttonHandler = isConnected
    ? () => {
        if (!isWrongNetwork) {
          (activeTab === "stake" ? stakeActionFn : unstakeActionFn)({
            amount: poolData.lpTokenParser(stakeAmount),
          });
        }
      }
    : walletConnectionHandler;

  const buttonTextPrefix = isConnected ? "" : "Connect wallet to ";
  const buttonMaxValue =
    activeTab === "stake"
      ? poolData.availableLPTokenBalance
      : poolData.userAmountOfLPStaked;
  const buttonMaxValueText = poolData
    .lpTokenFormatter(buttonMaxValue)
    .replaceAll(",", "");

  const ArrowIcon = isPoolInfoVisible ? ArrowIconUp : ArrowIconDown;

  const validateStakeAmount = (amount: string) =>
    isNumericWithinRange(
      amount,
      true,
      "0",
      buttonMaxValue,
      poolData.lpTokenParser
    );

  const valueOrEmpty = repeatableTernaryBuilder(
    isConnected && !isWrongNetwork && !isDataLoading,
    <>-</>
  );

  useEffect(() => {
    if (!isMutating) {
      setStakeAmount("");
    }
  }, [activeTab, isMutating]);

  useEffect(() => {
    setIsPoolInfoVisible(false);
  }, [isConnected]);

  const activeColor =
    "white-" + (poolData.userAmountOfLPStaked.gt(0) ? 100 : 70);
  const lpFmt = poolData.lpTokenFormatter;

  return (
    <SectionTitleWrapperV2 title="Staking">
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
            logoURI={logoURI}
            maxValue={buttonMaxValueText}
            omitInput={!isConnected}
            onClickHandler={buttonHandler}
            displayLoader={isMutating}
          />
        </InputBlockWrapper>
        <Divider />
        <StakeInfo>
          <StakeInfoRow>
            <StakeInfoItem>Staked LP Tokens</StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <>
                  <Text color={activeColor}>
                    {lpFmt(poolData.userAmountOfLPStaked)}
                  </Text>{" "}
                  <Text color="white-70">
                    / {lpFmt(poolData.usersTotalLPTokens)}{" "}
                    {poolData.lpTokenSymbolName}
                  </Text>
                </>
              )}
            </StakeInfoItem>
          </StakeInfoRow>
          <StakeInfoRow>
            <StakeInfoItem>
              Age of capital
              <PopperTooltip
                title="Age of Capital"
                body="Number of days you've staked LP tokens without claiming rewards. Weighted by size if multiple positions have been staked."
                placement="bottom-start"
              >
                <InfoIcon />
              </PopperTooltip>
            </StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <>
                  <Text color={activeColor}>
                    {poolData.elapsedTimeSinceAvgDeposit <= 0
                      ? "-"
                      : `${formatNumberMaxFracDigits(
                          poolData.elapsedTimeSinceAvgDeposit
                        )} Days`}{" "}
                  </Text>
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
                <>
                  <StyledProgressBar
                    percent={poolData.usersMultiplierPercentage}
                  />{" "}
                  <Text color={activeColor}>
                    {formatEther(poolData.currentUserRewardMultiplier)} x
                  </Text>
                </>
              )}
            </StakeInfoItem>
          </StakeInfoRow>
          <StakeInfoRow>
            <Text color="white-70" size="sm">
              Note: Multipliers of previously staked tokens are not impacted
            </Text>
          </StakeInfoRow>
          <Divider />
          <StakeAPYInfoRow
            onClick={() => {
              setIsPoolInfoVisible((value) => !value);
            }}
          >
            <StakeInfoItem>
              <APYInfoItem>
                <ArrowIcon />
                APY
                <PopperTooltip
                  title="Rewards APY"
                  body="The base reward APY times your multiplier."
                  placement="bottom-start"
                >
                  <InfoIcon />
                </PopperTooltip>
              </APYInfoItem>
            </StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <Text color={activeColor}>
                  {formatEther(poolData.apyData.totalApy)}%
                </Text>
              )}
            </StakeInfoItem>
          </StakeAPYInfoRow>
          <InnerPoolStakeInfo visible={isPoolInfoVisible}>
            <Divider />
            <StakeInfoRow>
              <StakeInfoItem>Your Rewards APY</StakeInfoItem>
              <StakeInfoItem>
                {valueOrEmpty(
                  <>
                    <Text color={"white-70"}>
                      Base {formatEther(poolData.apyData.baseRewardsApy)}%
                    </Text>
                    &nbsp;{" "}
                    <Text color={activeColor}>
                      {formatEther(poolData.apyData.rewardsApy)}%
                    </Text>
                  </>
                )}
              </StakeInfoItem>
            </StakeInfoRow>
            <StakeInfoRow>
              <StakeInfoItem>Pool APY</StakeInfoItem>
              <StakeInfoItem>
                {valueOrEmpty(
                  <Text color={activeColor}>
                    {formatEther(poolData.apyData.poolApy)}%
                  </Text>
                )}
              </StakeInfoItem>
            </StakeInfoRow>
          </InnerPoolStakeInfo>
        </StakeInfo>
      </Card>
    </SectionTitleWrapperV2>
  );
};

export default StakingForm;
