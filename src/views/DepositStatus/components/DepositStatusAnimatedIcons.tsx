import { COLORS, getChainInfo } from "utils";
import { DepositStatus } from "../types";
import styled from "@emotion/styled";
import { ReactComponent as CheckStarPending } from "assets/icons/check-star-ring-opaque-pending.svg";
import { ReactComponent as CheckStarCompleted } from "assets/icons/check-star-ring-opaque-completed.svg";

const BlurLoadingAnimation = () => (
  <AnimatedBlurLoader>
    <AnimatedBlurLoaderCenter />
    <AnimatedBlurLoaderFade />
  </AnimatedBlurLoader>
);

type DepositStatusAnimatedIconsParams = {
  status: DepositStatus;
  fromChainId: number;
  toChainId: number;
};

const DepositStatusAnimatedIcons = ({
  status,
  fromChainId,
  toChainId,
}: DepositStatusAnimatedIconsParams) => {
  const GrayscaleLogoFromChain = getChainInfo(fromChainId).grayscaleLogoSvg;
  const GrayscaleLogoToChain = getChainInfo(toChainId).grayscaleLogoSvg;

  return (
    <>
      <SVGGradientDefs />
      <TopWrapperAnimationWrapper>
        <AnimatedLogoWrapper completed={status === "filled"}>
          {status === "depositing" && <BlurLoadingAnimation />}
          <LogoWrapper
            status={
              status === "filled"
                ? "completed"
                : status === "deposit-reverted"
                  ? "pending"
                  : "active"
            }
          >
            <GrayscaleLogoFromChain />
          </LogoWrapper>
        </AnimatedLogoWrapper>
        <Divider />
        {status === "filled" ? <CheckStarCompleted /> : <CheckStarPending />}
        <Divider />
        <AnimatedLogoWrapper completed={status === "filled"}>
          {status === "filling" && <BlurLoadingAnimation />}
          <LogoWrapper
            status={
              status === "filling"
                ? "active"
                : status === "filled"
                  ? "completed"
                  : "pending"
            }
          >
            <GrayscaleLogoToChain />
          </LogoWrapper>
        </AnimatedLogoWrapper>
      </TopWrapperAnimationWrapper>
    </>
  );
};

export default DepositStatusAnimatedIcons;

const Divider = styled.div`
  width: 20px;
  height: 0px;
  opacity: 0.25;

  border: 2px solid ${COLORS["grey-400"]};
  border-radius: 16px;
`;

const LogoWrapper = styled.div<{ status: "pending" | "active" | "completed" }>`
  width: 100%;
  height: 100%;

  z-index: 1;

  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.45);
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.45));
  border-radius: 48px;

  & svg,
  img {
    border-radius: 100%;
    & rect,
    circle,
    #path-to-animate {
      transition:
        fill 1s ease-in-out,
        color 1s ease-in-out;
    }
  }

  & svg {
    & rect,
    circle,
    #path-to-animate {
      fill: ${({ status }) =>
        status === "pending"
          ? "url(#pendingGradient)"
          : status === "active"
            ? "url(#activeGradient)"
            : "url(#completedGradient)"};
    }

    & path:not(#path-to-animate) {
      fill: ${COLORS["grey-500"]};
    }
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

const AnimatedLogoWrapper = styled.div<{ completed?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px;

  height: 52px;
  width: 52px;

  border-radius: 48px;

  position: relative;
  overflow: clip;

  background: ${({ completed }) =>
    completed
      ? "linear-gradient( 180deg,#cffff426 0%,#6cf9d826 100%)"
      : "#ffffff26"};

  transition: background 1s;

  & * {
    height: 100%;
    width: 100%;
  }
`;

const AnimatedBlurLoader = styled.div`
  width: 3px !important;
  height: 68px;

  display: block;

  position: absolute;

  top: 0px;
  left: 50%;

  z-index: 0;

  animation: sweep 3s infinite ease-in-out;
  @keyframes sweep {
    0% {
      left: -6px;
    }
    50% {
      left: calc(100% + 6px);
    }
    100% {
      left: -6px;
    }
  }
`;

const AnimatedBlurLoaderCenter = styled.div`
  flex-shrink: 0;

  position: absolute;
  top: 0px;
  left: 2px;

  width: 1px !important;
  height: 100%;

  background: linear-gradient(180deg, #fff 0%, #676767 100%);

  z-index: 1;
`;

const AnimatedBlurLoaderFade = styled.div`
  flex-shrink: 0;
  filter: blur(2px);
  background: linear-gradient(180deg, #fff 0%, #7b7b7b 100%);

  position: absolute;
  top: 0px;
  left: 1px;

  width: 3px;
  height: 100%;

  z-index: 0;
`;

/**
 * We need this here to provide gradient definitions so that we can dynamically update
 * our chain logos
 */
const SVGGradientDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#9daab3" stopOpacity="1" />
        <stop offset="100%" stopColor="#393a40" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
        <stop offset="100%" stopColor="#A5A5A5" stopOpacity="1" />
      </linearGradient>
      <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#CFFFF4" stopOpacity="1" />
        <stop offset="100%" stopColor="#6CF9D8" stopOpacity="1" />
      </linearGradient>
    </defs>
  </svg>
);
