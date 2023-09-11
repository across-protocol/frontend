import { useEffect, useState } from "react";
import { utils } from "ethers";
import {
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

import { Tooltip } from "components/Tooltip";
import { Tab, Tabs } from "components/TabsV2";
import StakingInputBlock from "../StakingInputBlock";
import { StakingFormPropType } from "../../types";
import { repeatableTernaryBuilder } from "utils/ternary";
import { formatEther, formatWeiPct, formatNumberMaxFracDigits } from "utils";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { Text } from "components/Text";
import { useStakeFormLogic } from "views/Staking/hooks/useStakeFormLogic";
import ConnectWalletButton from "../ConnectWalletButton";
import CardWrapper from "components/CardWrapper";

export const StakingForm = ({
  isConnected,
  stakeActionFn,
  unstakeActionFn,
  isWrongNetwork,
  isDataLoading,
  isMutating,
  poolData: originPoolData,
  logoURI,
  logoURIs,
}: StakingFormPropType) => {
  const [isPoolInfoVisible, setIsPoolInfoVisible] = useState(false);

  const {
    setAmount,
    setStakingAction,
    amount,
    isAmountValid,
    isAmountInvalid,
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
  const buttonMaxValueText = utils.formatUnits(
    buttonMaxValue,
    poolData.lpTokenDecimalCount
  );

  const ArrowIcon = isPoolInfoVisible ? ArrowIconUp : ArrowIconDown;

  const valueOrEmpty = repeatableTernaryBuilder(
    isConnected && !isWrongNetwork && !isDataLoading && !isMutating,
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
  const isStakingPoolEnabled = poolData.poolEnabled;

  return (
    <SectionTitleWrapperV2 title="Staking">
      <CardWrapper>
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
              invalid={isAmountInvalid}
              buttonText={stakingAction}
              logoURI={logoURI}
              logoURIs={logoURIs}
              maxValue={buttonMaxValueText}
              stakingAction={stakingAction}
              onClickHandler={buttonHandler}
              displayLoader={isMutating}
              warningButtonColor={stakingAction === "unstake"}
              disableInput={
                isDataLoading || isMutating || !poolData.poolEnabled
              }
            />
          ) : (
            <ConnectWalletButton reasonToConnect={stakingAction} />
          )}
          {isConnected && maximumValue.eq(0) && stakingAction === "unstake" && (
            <Text color="warning" size="sm">
              You don't have any tokens to unstake.
            </Text>
          )}
          {!isDataLoading && !isStakingPoolEnabled && (
            <Text color="warning" size="sm">
              Staking is not enabled for {poolData.tokenSymbol}-LP
            </Text>
          )}
        </InputBlockWrapper>
        <Divider />
        <StakeInfo>
          <StakeInfoRow>
            <StakeInfoItem>
              Staked LP Tokens
              <Tooltip
                title="Staked LP Tokens"
                body="This displays your staked LP token amount. The amount in underlying can be seen in the Pool tab."
                placement="bottom-start"
              >
                <InfoIcon />
              </Tooltip>
            </StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <>
                  <Text color={activeColor}>
                    {lpFmt(poolData.userAmountOfLPStaked)}
                  </Text>
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
              <Tooltip
                title="Age of Capital"
                body="Number of days you've staked LP tokens without claiming rewards. Weighted by size if multiple positions have been staked."
                placement="bottom-start"
              >
                <InfoIcon />
              </Tooltip>
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
              <Tooltip
                title="Multiplier"
                body="Your multiple applied to the pool's base reward APY, determined by your age of capital."
                placement="bottom-start"
              >
                <InfoIcon />
              </Tooltip>
            </StakeInfoItem>
            <StakeInfoItem>
              {valueOrEmpty(
                <>
                  <StyledProgressBar
                    active={Boolean(amount) && isAmountValid}
                    percent={poolData.usersMultiplierPercentage}
                  />
                  <Text color={activeColor}>
                    {Number(
                      formatEther(poolData.currentUserRewardMultiplier)
                    ).toFixed(2)}
                    x
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
                <Tooltip
                  title="Rewards APR"
                  body="Your total APY for the pool, including the pool APY plus rewards APR times your multiplier. Max APY is the maximum APY after you have staked your LP tokens for 100 days."
                  placement="bottom-start"
                >
                  <InfoIcon />
                </Tooltip>
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
                Rewards APY
                <Tooltip
                  title="Rewards APY"
                  body="The base reward APR times your multiplier."
                  placement="bottom-start"
                >
                  <InfoIcon />
                </Tooltip>
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
      </CardWrapper>
    </SectionTitleWrapperV2>
  );
};

export default StakingForm;
