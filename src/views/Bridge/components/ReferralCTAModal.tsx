import styled from "@emotion/styled";
import { ReactComponent as UserIcon } from "assets/icons/user.svg";
import { ReactComponent as XBlueCheck } from "assets/icons/x-blue-check.svg";
import { ReactComponent as XIconWhite } from "assets/icons/x-white.svg";
import { Modal, PrimaryButton, Text } from "components";
import { useConnection } from "hooks";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { useReferralLink } from "hooks/useReferralLink";
import { useEffect } from "react";
import { COLORS } from "utils";
import ACXReferralLinkCard from "views/RewardsProgram/ACXReferralsProgram/ACXReferralLinkCard";

type ReferralCTAModalProps = {
  isOpen: boolean;
  exitModalHandler: () => void;
};

const ReferralCTAModal = ({
  isOpen,
  exitModalHandler,
}: ReferralCTAModalProps) => {
  const { isConnected } = useConnection();
  const { isMobile } = useCurrentBreakpoint();
  const { condensedReferralLink, referralLinkWithProtocol } = useReferralLink();
  const onClick = () => {
    const twitterShareLink = `https://twitter.com/intent/tweet?text=I've just received $ACX token rewards for bridging with @AcrossProtocol.%0A%0AUse my referral link to earn $ACX each time you bridge:%0A%0A${referralLinkWithProtocol}`;
    window.open(twitterShareLink, "_blank")?.focus();
  };

  // We want to immediately close the modal if the user disconnects.
  // Otherwise, the user will be able to see the modal, but won't have a referral link to share.
  useEffect(() => {
    if (!isConnected) {
      exitModalHandler();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <Modal
      exitModalHandler={exitModalHandler}
      isOpen={isOpen}
      width={482}
      verticalLocation={{
        tablet: "middle",
        desktop: "middle",
        mobile: "bottom",
      }}
      topYOffset={isMobile ? 16 : 112}
      bottomYOffset={isMobile ? 112 : undefined}
      exitOnOutsideClick
      title="Share referral link"
      padding="normal"
      height={800}
    >
      <Wrapper>
        <ACXReferralLinkCard condensed />
        <HorizontalDividerWrapper>
          <HorizontalDividerLine fadeToLeft />
          <Text size="sm" color="grey-400">
            Or share it on
          </Text>
          <XIconWhite />
          <HorizontalDividerLine />
        </HorizontalDividerWrapper>
        <TwitterPreviewWrapper>
          <TwitterPreviewTitleRow>
            <StyledUserIcon />
            <TwitterPreviewTitleTextWrapper>
              <TwitterPreviewTitleBlueCheckStack>
                <Text size="md" color="white">
                  Across User
                </Text>
                <XBlueCheck />
              </TwitterPreviewTitleBlueCheckStack>
              <Text size="sm" color="grey-400">
                @AcrossBridgor_01
              </Text>
            </TwitterPreviewTitleTextWrapper>
          </TwitterPreviewTitleRow>
          <Text size="md" color="white">
            I've just received $ACX token rewards for bridging with{" "}
            <Link href="https://twitter.com/AcrossProtocol" target="_blank">
              @acrossprotocol
            </Link>
            .
            <br /> <br />
            Use my referral link to earn $ACX each time you bridge:
          </Text>
          <Text size="md" color="light-blue-200">
            <Link href={referralLinkWithProtocol} target="_blank">
              {condensedReferralLink}
            </Link>
          </Text>
        </TwitterPreviewWrapper>
        <Button onClick={onClick}>
          Share on <XIconPrimary />
        </Button>
      </Wrapper>
    </Modal>
  );
};

export default ReferralCTAModal;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  width: 100%;
`;

const HorizontalDividerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  align-self: stretch;
`;

const HorizontalDividerLine = styled.div<{ fadeToLeft?: boolean }>`
  height: 1px;
  flex: 1 0 0;
  opacity: 0.1;
  background: linear-gradient(
    ${({ fadeToLeft }) =>
      fadeToLeft
        ? "270deg, #FFF 0.32%, rgba(255, 255, 255, 0.00) 100%"
        : "90deg, #FFF 0.32%, rgba(255, 255, 255, 0.00) 100%"}
  );
`;

const TwitterPreviewWrapper = styled.div`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;

  border-radius: 12px;
  border: 1px solid ${COLORS["black-700"]};
  background: ${COLORS["black-800"]};
`;

const TwitterPreviewTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
`;

const TwitterPreviewTitleTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TwitterPreviewTitleBlueCheckStack = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StyledUserIcon = styled(UserIcon)`
  height: 48px;
  width: 48px;
`;

const Link = styled.a`
  color: ${COLORS["light-blue-200"]};
  text-decoration: none;
  display: inline;
`;

const Button = styled(PrimaryButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

  background: transparent;
  width: 100%;
  height: 48px;

  border: 1px solid ${COLORS["primary"]};
  color: ${COLORS["primary"]};
`;

const XIconPrimary = styled(XIconWhite)`
  height: 16px;
  width: 16px;
  margin-top: 1px;
  & path {
    fill: ${COLORS["primary"]};
  }
`;
