import { useState } from "react";

import { useFeatureFlag } from "hooks/feature-flags/useFeatureFlag";
import { useHasPolymarketAccount } from "./useHasPolymarketAccount";
import { PolymarketAddressModal } from "./PolymarketAddressModal";
import {
  BannerWrapper,
  BannerHeader,
  LogoIcon,
  PolymarketLogo,
  BannerBrandText,
  BannerContent,
  SendIconContainer,
  TextContainer,
  BannerTitle,
  BannerSubtitle,
} from "./PolymarketBanner.styles";

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 10H7.5M17.5 10L13.75 6.25M17.5 10L13.75 13.75M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5"
        stroke="#1a5cff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PolymarketBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const featureFlagEnabled = useFeatureFlag("polymarket-banner");
  const { hasAccount, proxyWallet, isLoading } = useHasPolymarketAccount();

  const shouldShow = featureFlagEnabled && hasAccount && !isLoading;

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <BannerWrapper onClick={() => setIsModalOpen(true)}>
        <BannerHeader>
          <LogoIcon>
            <PolymarketLogo>P</PolymarketLogo>
          </LogoIcon>
          <BannerBrandText>Polymarket</BannerBrandText>
        </BannerHeader>
        <BannerContent>
          <SendIconContainer>
            <SendIcon />
          </SendIconContainer>
          <TextContainer>
            <BannerTitle>Add funds to Polymarket</BannerTitle>
            <BannerSubtitle>Get instant quotes</BannerSubtitle>
          </TextContainer>
        </BannerContent>
      </BannerWrapper>

      <PolymarketAddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultAddress={proxyWallet}
      />
    </>
  );
}
