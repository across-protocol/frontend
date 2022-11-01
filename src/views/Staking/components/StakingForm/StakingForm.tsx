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
import { formatEther, formatWeiPct, formatNumberMaxFracDigits } from "utils";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { Text } from "components/Text";
import { useStakeFormLogic } from "views/Staking/hooks/useStakeFormLogic";
import ConnectWalletButton from "../ConnectWalletButton";

export const StakingForm = ({
  isConnected,
  stakeActionFn,
  unstakeActionFn,
  isWrongNetwork,
  isDataLoading,
  isMutating,
  poolData: originPoolData,
  logoURI,
}: StakingFormPropType) => {
  const [isPoolInfoVisible, setIsPoolInfoVisible] = useState(false);

  const {
    setAmount,
    setStakingAction,
    amount,
    isAmountValid,
    stakingAction,
    maximumValue,
    updatedPoolData: poolData,
  } = useStakeFormLogic(originPoolData, isDataLoading);

  const buttonHandler = () => {
    if (!isWrongNetwork && isAmountValid && amount) {
      (stakingAction === "stake" ? stakeActionFn : unstakeActionFn)({
        amount: poolData.lpTokenParser(amount),
      });
    }
  };

  const buttonMaxValue = maximumValue;
  const buttonMaxValueText = poolData
    .lpTokenFormatter(buttonMaxValue)
    .replaceAll(",", "");

  const ArrowIcon = isPoolInfoVisible ? ArrowIconUp : ArrowIconDown;

  const valueOrEmpty = repeatableTernaryBuilder(
    isConnected && !isWrongNetwork && !isDataLoading,
    <>-</>
  );

  useEffect(() => {
    if (!isMutating) {
      setAmount(undefined);
    }
  }, [stakingAction, isMutating, setAmount]);

  useEffect(() => {
    setIsPoolInfoVisible(false);
  }, [isConnected]);

  const activeColor = "white-" + (amount && isAmountValid ? 100 : 70);
  const lpFmt = poolData.lpTokenFormatter;

  return (
    <SectionTitleWrapperV2 title="Staking">
      <Card>
        <Tabs>
          <Tab
            onClick={() => !isMutating && setStakingAction("stake")}
            active={stakingAction === "stake"}
          >
            <Text
              weight={500}
              color={"white-" + (stakingAction === "stake" ? "100" : "70")}
            >
              Stake
            </Text>
          </Tab>
          <Tab
            onClick={() => !isMutating && setStakingAction("unstake")}
            active={stakingAction === "unstake"}
          >
            <Text
              weight={500}
              color={"white-" + (stakingAction === "unstake" ? "100" : "70")}
            >
              Unstake
            </Text>
          </Tab>
        </Tabs>
        <InputBlockWrapper>
          {isConnected ? (
            <StakingInputBlock
              value={amount ?? ""}
              setValue={setAmount}
              valid={isAmountValid}
              buttonText={stakingAction}
              logoURI={logoURI}
              maxValue={buttonMaxValueText}
              onClickHandler={buttonHandler}
              displayLoader={isMutating}
            />
          ) : (
            <ConnectWalletButton reasonToConnect={stakingAction} />
          )}
          {isConnected && maximumValue.eq(0) && stakingAction === "unstake" && (
            <Text color="warning" size="sm">
              You don’t have any tokens to unstake.
            </Text>
          )}
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
                    {formatNumberMaxFracDigits(
                      poolData.elapsedTimeSinceAvgDeposit
                    )}{" "}
                    Days
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
                    active={Boolean(amount) && isAmountValid}
                    percent={poolData.usersMultiplierPercentage}
                  />
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
                  title="APY"
                  body="Your total APY for the pool, including the pool APY plus rewards APY times your multiplier. Max APY is the maximum APY after you have staked your LP tokens for 100 days."
                  placement="bottom-start"
                >
                  <InfoIcon />
                </PopperTooltip>
              </APYInfoItem>
            </StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <Text color={activeColor}>
                  {formatWeiPct(poolData.apyData.totalApy)}%
                </Text>
              )}
            </StakeInfoItem>
          </StakeAPYInfoRow>
          <InnerPoolStakeInfo visible={isPoolInfoVisible}>
            <Divider />
            <StakeInfoRow>
              <StakeInfoItem>
                Rewards APY{" "}
                <PopperTooltip
                  title="Rewards APY"
                  body="The base reward APY times your multiplier."
                  placement="bottom-start"
                >
                  <InfoIcon />
                </PopperTooltip>
              </StakeInfoItem>
              <StakeInfoItem>
                {valueOrEmpty(
                  <>
                    <Text color={"white-70"}>
                      Base {formatWeiPct(poolData.apyData.baseRewardsApy)}%
                    </Text>
                    &nbsp;{" "}
                    <Text color={activeColor}>
                      {formatWeiPct(poolData.apyData.rewardsApy)}%
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
                    {formatWeiPct(poolData.apyData.poolApy)}%
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
