import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import React, { Suspense } from "react";

import BgBanner from "assets/bg-banners/deposit-banner.svg";
import { ReactComponent as CheckStarDepositingIcon } from "assets/icons/check-star-ring-opaque-depositing.svg";
import { ReactComponent as CheckStarDepositRevertedIcon } from "assets/icons/check-star-ring-opaque-deposit-reverted.svg";
import { ReactComponent as CheckStarFillingIcon } from "assets/icons/check-star-ring-opaque-filling.svg";
import { ReactComponent as CheckStarFilledIcon } from "assets/icons/check-star-ring-opaque-filled.svg";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { Text, Badge } from "components";

import {
  QUERIESV2,
  COLORS,
  NoV3FundsDepositedLogError,
  getChainInfo,
} from "utils";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";

import { useDepositTracking } from "../hooks/useDepositTracking";
import { DepositTimesCard } from "./DepositTimesCard";
import { ElapsedTime } from "./ElapsedTime";
import { DepositStatus } from "../types";
import { FromBridgePagePayload } from "views/Bridge/hooks/useBridgeAction";
import { DateTime } from "luxon";

type Props = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  inputTokenSymbol: string;
  outputTokenSymbol?: string;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusUpperCard({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
  inputTokenSymbol,
  outputTokenSymbol,
}: Props) {
  const { depositQuery, fillQuery } = useDepositTracking(
    depositTxHash,
    fromChainId,
    toChainId,
    fromBridgePagePayload
  );

  const depositTxSentTime = fromBridgePagePayload?.timeSigned;
  const depositTxCompletedTime = depositQuery.data?.depositTimestamp;
  const fillTxCompletedTime = fillQuery.data?.fillTxTimestamp;

  const { elapsedSeconds: depositTxElapsedSeconds } = useElapsedSeconds(
    depositTxSentTime ? Math.floor(depositTxSentTime / 1000) : undefined,
    depositTxCompletedTime
  );
  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

  const status = !depositTxCompletedTime
    ? "depositing"
    : depositQuery.data?.depositTxReceipt.status === 0
      ? "deposit-reverted"
      : !fillTxCompletedTime
        ? "filling"
        : "filled";

  // This error indicates that the used deposit tx hash does not originate from
  // an Across SpokePool contract.
  if (depositQuery.error instanceof NoV3FundsDepositedLogError) {
    return (
      <Wrapper>
        <TopWrapperTitleWrapper>
          <Text size="lg" color="error">
            Invalid deposit tx hash
          </Text>
        </TopWrapperTitleWrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <TopWrapperAnimationWrapper>
        <AnimatedLogoWrapperFromChain status={status}>
          <AnimatedLogoFromChain status={status}>
            <GrayscaleLogo
              grayscaleLogoURI={getChainInfo(fromChainId).grayscaleLogoURI}
            />
          </AnimatedLogoFromChain>
        </AnimatedLogoWrapperFromChain>
        <AnimatedDividerFromChain status={status} />
        {status === "depositing" ? (
          <StyledCheckStarDepositingIcon />
        ) : status === "deposit-reverted" ? (
          <StyledCheckStarDepositRevertedIcon />
        ) : status === "filling" ? (
          <StyledCheckStarFillingIcon />
        ) : (
          <StyledCheckStarFilledIcon />
        )}
        <AnimatedDividerToChain status={status} />
        <AnimatedLogoWrapperToChain status={status}>
          <AnimatedLogoToChain status={status}>
            <GrayscaleLogo
              grayscaleLogoURI={getChainInfo(toChainId).grayscaleLogoURI}
            />
          </AnimatedLogoToChain>
        </AnimatedLogoWrapperToChain>
      </TopWrapperAnimationWrapper>
      {status === "filled" ? (
        <AnimatedTopWrapperTitleWrapper>
          <ElapsedTime
            textSize="3xl"
            elapsedSeconds={fillTxElapsedSeconds}
            isCompleted
          />
          <Text size="lg" color="grey-400">
            Transfer successful!
          </Text>
        </AnimatedTopWrapperTitleWrapper>
      ) : status === "deposit-reverted" ? (
        <AnimatedTopWrapperTitleWrapper>
          {depositTxElapsedSeconds ? (
            <ElapsedTime
              textSize="3xl"
              elapsedSeconds={depositTxElapsedSeconds}
              textColor="warning"
            />
          ) : (
            <Text size="3xl" color="warning">
              {DateTime.fromSeconds(
                depositTxCompletedTime || Date.now()
              ).toFormat("d MMM yyyy - t")}
            </Text>
          )}
          <DepositRevertedRow>
            <Text size="lg" color="warning">
              Deposit unsuccessful
            </Text>
            <a
              href={`${
                getChainInfo(fromChainId).explorerUrl
              }/tx/${depositTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InfoIcon />
            </a>
          </DepositRevertedRow>
        </AnimatedTopWrapperTitleWrapper>
      ) : (
        <TopWrapperTitleWrapper>
          <ElapsedTime
            textSize="3xl"
            elapsedSeconds={
              status === "depositing"
                ? depositTxElapsedSeconds
                : fillTxElapsedSeconds
            }
          />
          <SubTitleWrapper>
            <Text size="lg" color="grey-400">
              {status === "depositing"
                ? "Depositing on source chain..."
                : "Filling on destination chain..."}
            </Text>
            <Badge textColor="grey-400">
              <Text size="lg" color="grey-400">
                {status === "depositing" ? "1 / 2" : "2 / 2"}
              </Text>
            </Badge>
          </SubTitleWrapper>
        </TopWrapperTitleWrapper>
      )}
      <DepositTimesCard
        status={status}
        depositTxCompletedTimestampSeconds={depositTxCompletedTime}
        depositTxElapsedSeconds={depositTxElapsedSeconds}
        fillTxElapsedSeconds={fillTxElapsedSeconds}
        fillTxHash={fillQuery.data?.fillTxHashes[0]}
        depositTxHash={depositTxHash}
        fromChainId={fromChainId}
        toChainId={toChainId}
        inputTokenSymbol={inputTokenSymbol}
        outputTokenSymbol={outputTokenSymbol}
      />
    </Wrapper>
  );
}

const GrayscaleLogo = (props: { grayscaleLogoURI: string }) => {
  const Logo = React.lazy(async () => ({
    default: (await import(props.grayscaleLogoURI)).ReactComponent,
  }));
  return (
    <Suspense fallback={<img src={props.grayscaleLogoURI} />}>
      <Logo />
    </Suspense>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;

  background-image: url(${BgBanner});
  background-color: ${COLORS["black-800"]};
  border-bottom: 1px solid ${COLORS["grey-600"]};

  width: calc(100% + 48px);
  margin: 0 -24px;
  padding: 45px 24px 34px;
`;

const TopWrapperTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;

  width: 100%;
`;

const SubTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const AnimationFadeInBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(20%);
  }
  to { opacity: 1 }
`;

const AnimatedTopWrapperTitleWrapper = styled(TopWrapperTitleWrapper)`
  animation-name: ${AnimationFadeInBottom};
  animation-duration: 1s;
`;

const StyledCheckStarDepositingIcon = styled(CheckStarDepositingIcon)`
  & * {
    transition: stroke 0.5s ease-in-out;
  }
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 52px;
    height: 52px;
  }
`;
const StyledCheckStarDepositRevertedIcon = styled(CheckStarDepositRevertedIcon)`
  & * {
    transition: stroke 0.5s ease-in-out;
  }
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 52px;
    height: 52px;
  }
`;
const StyledCheckStarFillingIcon = styled(CheckStarFillingIcon)`
  & * {
    transition: stroke 0.5s ease-in-out;
  }
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 52px;
    height: 52px;
  }
`;
const StyledCheckStarFilledIcon = styled(CheckStarFilledIcon)`
  & * {
    transition: stroke 0.5s ease-in-out;
  }
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 52px;
    height: 52px;
  }
`;

const TopWrapperAnimationWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const AnimatedDivider = styled.div<{ status: DepositStatus }>`
  width: ${({ status }) => (status === "filled" ? "22px" : "50px")};
  height: 1px;
  flex-shrink: 0;

  transition:
    width 0.5s ease-in-out,
    background-color 0.5s ease-in-out;
`;

const AnimatedDividerFromChain = styled(AnimatedDivider)<{
  status: DepositStatus;
}>`
  background: ${({ status }) =>
    status === "deposit-reverted"
      ? COLORS.warning
      : status === "depositing"
        ? COLORS.white
        : COLORS.aqua};
`;

const AnimatedDividerToChain = styled(AnimatedDivider)<{
  status: DepositStatus;
}>`
  background: ${({ status }) =>
    status === "depositing" || status === "deposit-reverted"
      ? COLORS["grey-400"]
      : status === "filling"
        ? COLORS.white
        : COLORS.aqua};
`;

const AnimatedLogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  width: 60px;
  height: 60px;

  background: ${COLORS["black-800"]};

  border: 1px solid;
  transition: border-color 0.5s ease-in-out;

  border-radius: 100px;

  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 40px;
    height: 40px;
  }
`;

const AnimatedLogoWrapperFromChain = styled(AnimatedLogoWrapper)<{
  status: DepositStatus;
}>`
  border-color: ${({ status }) =>
    status === "deposit-reverted"
      ? COLORS.warning
      : status === "depositing"
        ? COLORS.white
        : COLORS.aqua};
`;

const AnimatedLogoWrapperToChain = styled(AnimatedLogoWrapper)<{
  status: DepositStatus;
}>`
  border-color: ${({ status }) =>
    status === "depositing" || status === "deposit-reverted"
      ? COLORS["grey-400"]
      : status === "filling"
        ? COLORS.white
        : COLORS.aqua};
`;

const AnimatedLogo = styled.div<{
  completed?: boolean;
}>`
  width: 48px;
  height: 48px;
  & svg,
  img {
    width: 48px;
    height: 48px;
    border-radius: 100%;
    & rect,
    circle,
    #path-to-animate {
      transition: fill 1s ease-in-out;
    }
  }

  @media ${QUERIESV2.sm.andDown} {
    width: 32px;
    height: 32px;

    & svg,
    img {
      width: 32px;
      height: 32px;
    }
  }
`;

const AnimatedLogoFromChain = styled(AnimatedLogo)<{ status: DepositStatus }>`
  & svg {
    & rect,
    circle,
    #path-to-animate {
      fill: ${({ status }) =>
        status === "deposit-reverted"
          ? COLORS.warning
          : status === "depositing"
            ? COLORS.white
            : COLORS.aqua};
    }
  }
`;

const AnimatedLogoToChain = styled(AnimatedLogo)<{ status: DepositStatus }>`
  & svg {
    & rect,
    circle,
    #path-to-animate {
      fill: ${({ status }) =>
        status === "depositing" || status === "deposit-reverted"
          ? COLORS["grey-400"]
          : status === "filling"
            ? COLORS.white
            : COLORS.aqua};
    }
  }
`;

const DepositRevertedRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;

  a {
    display: flex;
  }

  svg {
    cursor: pointer;
    height: 20px;
    width: 20px;
    path {
      stroke: ${COLORS.warning};
    }
  }
`;
