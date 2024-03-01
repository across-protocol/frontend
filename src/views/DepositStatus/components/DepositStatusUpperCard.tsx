import React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import BgBanner from "assets/bg-banners/deposit-banner.svg";
import { ReactComponent as CheckStarDepositingIcon } from "assets/check-star-ring-opaque-depositing.svg";
import { ReactComponent as CheckStarFillingIcon } from "assets/check-star-ring-opaque-filling.svg";
import { ReactComponent as CheckStarFilledIcon } from "assets/check-star-ring-opaque-filled.svg";
import { ReactComponent as EthereumGrayscaleLogo } from "assets/grayscale-logos/eth.svg";
import { ReactComponent as EspressoLogo } from "assets/espress-logo.svg";
import { ReactComponent as PolygonGrayscaleLogo } from "assets/grayscale-logos/polygon.svg";
import { ReactComponent as ArbitrumGrayscaleLogo } from "assets/grayscale-logos/arbitrum.svg";
import { ReactComponent as OptimismGrayscaleLogo } from "assets/grayscale-logos/optimism.svg";
import { ReactComponent as ZkSyncGrayscaleLogo } from "assets/grayscale-logos/zksync.svg";
import { ReactComponent as BaseGrayscaleLogo } from "assets/grayscale-logos/base.svg";
import { Text, Badge } from "components";

import { ChainId, QUERIESV2, COLORS, NoFundsDepositedLogError } from "utils";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";

import { useDepositTracking } from "../hooks/useDepositTracking";
import { DepositTimesCard } from "./DepositTimesCard";
import { ElapsedTime } from "./ElapsedTime";
import { DepositStatus, FromBridgePagePayload } from "../types";

const grayscaleLogos: Record<number, React.ReactNode> = {
  [ChainId.ARBITRUM]: <ArbitrumGrayscaleLogo />,
  [ChainId.POLYGON]: <PolygonGrayscaleLogo />,
  [ChainId.OPTIMISM]: <OptimismGrayscaleLogo />,
  [ChainId.MAINNET]: <EthereumGrayscaleLogo />,
  [ChainId.ZK_SYNC]: <ZkSyncGrayscaleLogo />,
  [ChainId.BASE]: <BaseGrayscaleLogo />,
  // testnets
  [ChainId.GOERLI]: <EthereumGrayscaleLogo />,
  [ChainId.ARBITRUM_GOERLI]: <EthereumGrayscaleLogo />,
  [ChainId.MUMBAI]: <EthereumGrayscaleLogo />,
  [ChainId.ZK_SYNC_GOERLI]: <ZkSyncGrayscaleLogo />,
  [ChainId.BASE_GOERLI]: <BaseGrayscaleLogo />,

  [ChainId.ESPRESSO_1]: <EspressoLogo />,
  [ChainId.ESPRESSO_2]: <EspressoLogo />,
};

type Props = {
  depositTxHash: string;
  fromChainId: number;
  toChainId: number;
  fromBridgePagePayload?: FromBridgePagePayload;
};

export function DepositStatusUpperCard({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
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
    : !fillTxCompletedTime
    ? "filling"
    : "filled";

  // This error indicates that the used deposit tx hash does not originate from
  // an Across SpokePool contract.
  if (depositQuery.error instanceof NoFundsDepositedLogError) {
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
            {grayscaleLogos[fromChainId]}
          </AnimatedLogoFromChain>
        </AnimatedLogoWrapperFromChain>
        <AnimatedDividerFromChain status={status} />
        {status === "depositing" ? (
          <StyledCheckStarDepositingIcon />
        ) : status === "filling" ? (
          <StyledCheckStarFillingIcon />
        ) : (
          <StyledCheckStarFilledIcon />
        )}
        <AnimatedDividerToChain status={status} />
        <AnimatedLogoWrapperToChain status={status}>
          <AnimatedLogoToChain status={status}>
            {grayscaleLogos[toChainId]}
          </AnimatedLogoToChain>
        </AnimatedLogoWrapperToChain>
      </TopWrapperAnimationWrapper>
      {status !== "filled" ? (
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
      ) : (
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
      />
    </Wrapper>
  );
}

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

  transition: width 0.5s ease-in-out, background-color 0.5s ease-in-out;
`;

const AnimatedDividerFromChain = styled(AnimatedDivider)<{
  status: DepositStatus;
}>`
  background: ${({ status }) =>
    status === "depositing" ? COLORS.white : COLORS.aqua};
`;

const AnimatedDividerToChain = styled(AnimatedDivider)<{
  status: DepositStatus;
}>`
  background: ${({ status }) =>
    status === "depositing"
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
    status === "depositing" ? COLORS.white : COLORS.aqua};
`;

const AnimatedLogoWrapperToChain = styled(AnimatedLogoWrapper)<{
  status: DepositStatus;
}>`
  border-color: ${({ status }) =>
    status === "depositing"
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
  & svg {
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

    & svg {
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
        status === "depositing" ? "COLORS.white" : COLORS.aqua};
    }
  }
`;

const AnimatedLogoToChain = styled(AnimatedLogo)<{ status: DepositStatus }>`
  & svg {
    & rect,
    circle,
    #path-to-animate {
      fill: ${({ status }) =>
        status === "depositing"
          ? COLORS["grey-400"]
          : status === "filling"
          ? COLORS.white
          : COLORS.aqua};
    }
  }
`;
