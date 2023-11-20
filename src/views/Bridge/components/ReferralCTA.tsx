import styled from "@emotion/styled";
import { COLORS, QUERIESV2 } from "utils";
import CloudBackground from "assets/bg-banners/cloud-staking.svg";
import { ReactComponent as ACXLogo } from "assets/across.svg";
import { PrimaryButton, Text } from "components";
import copy from "copy-to-clipboard";
import { useReferralLink } from "hooks/useReferralLink";
import { useCallback, useEffect, useState } from "react";
import { useConnection } from "hooks";

const ReferralCTA = () => {
  const { referralLinkWithProtocol } = useReferralLink();
  const { isConnected, connect } = useConnection();
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!isConnected) {
      connect({
        trackSection: "bridgeForm",
      });
      setIsCopied(false);
    } else if (referralLinkWithProtocol) {
      copy(referralLinkWithProtocol);
      setIsCopied(true);
    }
  }, [connect, isConnected, referralLinkWithProtocol]);

  useEffect(() => {
    if (isCopied) {
      const t = setTimeout(() => {
        setIsCopied(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  });

  return (
    <Wrapper>
      <LogoContainer>
        <StyledLogo />
      </LogoContainer>
      <TextStack>
        <Text color="white" size="md">
          Earn up to <HighlightText>80%</HighlightText> in ACX Rewards with
          referrals
        </Text>
        <Text color="grey-400" size="sm">
          Share your unique referral link and earn on every transaction made
          with your link.
        </Text>
      </TextStack>
      <StyledCopyButton
        onClick={handleCopy}
        size="md"
        backgroundColor="black-700"
        textColor="aqua"
        isCopied={isCopied}
        disabled={isCopied}
      >
        {isConnected ? "Copy link" : "Connect"}
      </StyledCopyButton>
      <TextButton size="md" weight={500} onClick={handleCopy}>
        {isConnected ? "copy" : "Connect"}
      </TextButton>
    </Wrapper>
  );
};

export default ReferralCTA;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
  align-self: stretch;

  padding: 24px 16px;

  border-radius: 8px;
  border: 1px solid ${COLORS["aqua-15"]};
  background: url(${CloudBackground}) no-repeat;

  @media ${QUERIESV2.sm.andDown} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;

    padding: 16px;
  }
`;

const LogoContainer = styled.div`
  // Layout
  display: flex;
  padding: 8px;
  align-items: flex-start;

  // Colors
  border-radius: 32px;
  border: 1px solid ${COLORS["grey-400-15"]};
  background: ${COLORS["grey-400-5"]};

  box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.08),
    0px 2px 6px 0px rgba(0, 0, 0, 0.08);

  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;

const StyledLogo = styled(ACXLogo)`
  height: 24px;
  width: auto;
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
`;

const StyledCopyButton = styled(PrimaryButton)<{ isCopied?: boolean }>`
  border: 1px solid ${COLORS["aqua-15"]};

  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
  transition: all 0.2s ease-in-out;

  background-color: ${({ isCopied }) =>
    isCopied ? COLORS["aqua"] : COLORS["black-700"]};
  color: ${({ isCopied }) => (isCopied ? COLORS["black-700"] : COLORS["aqua"])};
`;

const HighlightText = styled.span`
  color: ${COLORS["aqua"]};
`;

const TextButton = styled(Text)`
  cursor: pointer;
  color: ${COLORS["aqua"]};
  display: none;
  @media ${QUERIESV2.sm.andDown} {
    display: block;
  }
`;
