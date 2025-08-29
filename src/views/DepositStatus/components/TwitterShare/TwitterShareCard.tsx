import styled from "@emotion/styled";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";
import {
  isDefined,
  COLORS,
  QUERIES,
  buildSearchParams,
  resolveWebsiteUrl,
} from "utils";
import { DepositStatusLowerCardProps } from "views/DepositStatus/components/DepositStatusLowerCard";
import { useDepositTracking } from "views/DepositStatus/hooks/useDepositTracking";

import { SecondaryButton, Text } from "components";
import { ReactComponent as ShareIcon } from "assets/icons/share.svg";
import { ReactComponent as X } from "assets/icons/x-white.svg";
import { useEffect, useMemo, useState } from "react";
import { TwitterShareModal } from "./TwitterShareModal";
import axios from "axios";

const SHARE_THRESHOLD_SECONDS = 5; // only share if bridge is 5s or faster

type TwitterShareProps = DepositStatusLowerCardProps;

export function TwitterShareCard(props: TwitterShareProps) {
  const { depositTxHash, fromChainId, toChainId, fromBridgePagePayload } =
    props;
  const [showModal, setShowModal] = useState(false);
  const openModal = () => void setShowModal(true);
  const closeModal = () => void setShowModal(false);

  const { depositQuery, fillQuery } = useDepositTracking({
    depositTxHash,
    fromChainId,
    toChainId,
    fromBridgePagePayload,
  });

  const depositTxCompletedTime = depositQuery.data?.depositTimestamp;
  const fillTxCompletedTime = fillQuery.data?.fillTxTimestamp;

  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

  const imageUrl = useMemo(() => {
    if (
      isDefined(fillTxElapsedSeconds) &&
      fillTxElapsedSeconds <= SHARE_THRESHOLD_SECONDS
    ) {
      return `https://app-frontend-v3-git-feat-twitter-share-uma.vercel.app/api/twitter-share?${buildSearchParams(
        {
          fill_time: fillTxElapsedSeconds,
          from_chain: fromChainId,
          to_chain: toChainId,
        }
      )}`;
    }
  }, [fillTxElapsedSeconds, fromChainId, toChainId]);

  useEffect(() => {
    if (imageUrl) {
      // warm image endpoint
      void axios.get(imageUrl);
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return null;
  }

  return (
    <Card>
      <InnerRow>
        <LogoWrapper>
          <Icon />
        </LogoWrapper>
        <TexColumn>
          <Text size="md" color="white">
            Share and win!
          </Text>

          <Text size="sm">
            Share your experience on X to enter this week's drawing for{" "}
            <Highlight>1,000 ACX</Highlight> #PoweredByIntents
          </Text>
        </TexColumn>
      </InnerRow>

      <Button size="md" textColor="aqua" onClick={openModal}>
        Share on <XIcon />
      </Button>
      <TwitterShareModal
        imageUrl={imageUrl}
        isOpen={showModal}
        exitModalHandler={closeModal}
      />
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  padding: 24px;
  border: 1px solid ${COLORS["aqua-15"]}; //rgba(108, 249, 216, 0.15);
  background: var(--Color-Neutrals-black-800, #2d2e33);
  color: var(--Color-Neutrals-light-200, #e0f3ff);

  @media ${QUERIES.tabletAndUp} {
    flex-direction: row;
    padding: 20px 16px;
  }
`;

const InnerRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const TexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const Highlight = styled.span`
  color: ${COLORS["aqua"]};
`;

const Icon = styled(ShareIcon)`
  width: 35px;
  height: 35px;
`;

const XIcon = styled(X)`
  margin-left: 4px;
  color: ${COLORS["aqua"]};
`;

const LogoWrapper = styled.div`
  height: 40px;
  width: 40px;
`;

const Button = styled(SecondaryButton)`
  width: 100%;
  white-space: nowrap;
  border-radius: 10px;
  background: var(--Shades-Neutrals-neutral-900, #202024);
  box-shadow:
    0 0 4px 0 #6cf9d8,
    0 0 8px 0 rgba(108, 249, 216, 0.8),
    0 0 16px -2px rgba(108, 249, 216, 0.4),
    0 0 24px -4px rgba(108, 249, 216, 0.4),
    0 0 40px -8px #6cf9d8 !important;

  transition: box-shadow 300ms ease !important;

  &&:hover:not(:disabled) {
    box-shadow:
      0 0 2px 0 #6cf9d8,
      0 0 4px 0 rgba(108, 249, 216, 0.8),
      0 0 8px -1px rgba(108, 249, 216, 0.4),
      0 0 12px -2px rgba(108, 249, 216, 0.4),
      0 0 20px -4px #6cf9d8 !important;
  }

  @media ${QUERIES.tabletAndUp} {
    width: unset;
  }
`;
