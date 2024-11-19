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
    <TopWrapperAnimationWrapper>
      <AnimatedLogoWrapper
        completed={status === "filling" || status === "filled"}
      >
        {status === "depositing" && <BlurLoadingAnimation />}
        <LogoWrapper>
          <GrayscaleLogoFromChain />
        </LogoWrapper>
      </AnimatedLogoWrapper>
      <Divider />
      {status === "filled" ? <CheckStarCompleted /> : <CheckStarPending />}
      <Divider />
      <AnimatedLogoWrapper completed={status === "filled"}>
        {status === "filling" && <BlurLoadingAnimation />}
        <LogoWrapper>
          <GrayscaleLogoToChain />
        </LogoWrapper>
      </AnimatedLogoWrapper>
    </TopWrapperAnimationWrapper>
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

const LogoWrapper = styled.div`
  width: 100%;
  height: 100%;

  z-index: 1;
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
