import styled from "@emotion/styled";
import { useReferralLink } from "hooks/useReferralLink";
import { ReactComponent as UnstyledCopyIcon } from "assets/icons/copy.svg";
import { useCallback, useEffect, useState } from "react";
import { COLORS, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import copy from "copy-to-clipboard";
import { useConnection } from "hooks";

type CopyReferralLinkType = {
  condensed?: boolean;
};

const ACXReferralLinkCard = ({ condensed }: CopyReferralLinkType) => {
  const { isConnected } = useConnection();
  const { referralLink, condensedReferralLink, referralLinkWithProtocol } =
    useReferralLink();
  const displayedUrl = condensed ? condensedReferralLink : referralLink;

  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (completed && referralLinkWithProtocol) {
      copy(referralLinkWithProtocol);
      const timeoutId = setTimeout(() => {
        setCompleted(false);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [completed, referralLinkWithProtocol]);

  const clickHandler = useCallback(() => {
    if (isConnected) {
      setCompleted(true);
    }
  }, [isConnected]);

  return (
    <ReferralLinkWrapper
      data-cy="referral-links"
      onClick={clickHandler}
      isConnected={isConnected}
    >
      <ReferralLinkTextStack>
        <Text size="sm" color="grey-400">
          My Referral link
        </Text>
        <Text color="white" size="lg">
          {isConnected ? displayedUrl : "-"}
        </Text>
      </ReferralLinkTextStack>
      <StyledCopyIcon isCompleted={completed} />
    </ReferralLinkWrapper>
  );
};

export default ACXReferralLinkCard;

const StyledCopyIcon = styled(UnstyledCopyIcon)<{ isCompleted?: boolean }>`
  height: 16px;
  width: 16px;
  & path {
    stroke: ${({ isCompleted = false }) =>
      isCompleted ? "#6cf9d8" : "#e0f3ff"};
    transition: stroke 0.15s;
  }

  @media ${QUERIESV2.sm.andDown} {
    height: 16px;
    width: 16px;
  }
`;

const ReferralLinkWrapper = styled.div<{ isConnected: boolean }>`
  display: flex;
  padding: 20px;
  align-self: stretch;
  justify-content: space-between;
  align-items: center;
  flex: 1 0 0;

  border-radius: 12px;
  border: 1px solid ${COLORS["grey-600"]};
  background: ${COLORS["black-800"]};

  height: 72px;

  cursor: ${({ isConnected }) => (isConnected ? "pointer" : "not-allowed")};
`;

const ReferralLinkTextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
