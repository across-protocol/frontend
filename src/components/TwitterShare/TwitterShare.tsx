import styled from "@emotion/styled";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";
import { isDefined, buildTwitterShareUrl } from "utils";
import { DepositStatusLowerCardProps } from "views/DepositStatus/components/DepositStatusLowerCard";
import { useDepositTracking } from "views/DepositStatus/hooks/useDepositTracking";

const SHARE_THRESHOLD_SECONDS = 5; // only share if bridge is 5s or faster

type TwitterShareProps = DepositStatusLowerCardProps;

export function TwitterShare({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
}: TwitterShareProps) {
  const { depositQuery, fillQuery } = useDepositTracking(
    depositTxHash,
    fromChainId,
    toChainId,
    fromBridgePagePayload
  );

  const depositTxCompletedTime = depositQuery.data?.depositTimestamp;
  const fillTxCompletedTime = fillQuery.data?.fillTxTimestamp;

  const { elapsedSeconds: fillTxElapsedSeconds } = useElapsedSeconds(
    depositTxCompletedTime,
    fillTxCompletedTime
  );

  if (
    !isDefined(fillTxCompletedTime) ||
    !isDefined(fillTxElapsedSeconds) ||
    fillTxElapsedSeconds > SHARE_THRESHOLD_SECONDS
  ) {
    return <></>;
  }

  const shareUrl = buildTwitterShareUrl({
    time: fillTxElapsedSeconds,
    originChainId: fromChainId,
    destinationChainId: toChainId,
  });

  return (
    <LinkWrapper target="_blank" href={shareUrl}>
      <p>Share on X</p>
    </LinkWrapper>
  );
}

const LinkWrapper = styled.a`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 23px 12px;
`;
