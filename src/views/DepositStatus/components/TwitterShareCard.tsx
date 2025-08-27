import styled from "@emotion/styled";
import { useElapsedSeconds } from "hooks/useElapsedSeconds";
import { isDefined, buildTwitterShareUrl, COLORS } from "utils";
import { DepositStatusLowerCardProps } from "views/DepositStatus/components/DepositStatusLowerCard";
import { useDepositTracking } from "views/DepositStatus/hooks/useDepositTracking";
import { EarnActionCard } from "./EarnActionCard";
import { SecondaryButton, Text } from "components";
import { ReactComponent as ShareIcon } from "assets/icons/share.svg";
import { ReactComponent as X } from "assets/icons/x-white.svg";

const SHARE_THRESHOLD_SECONDS = 5; // only share if bridge is 5s or faster

type TwitterShareProps = DepositStatusLowerCardProps;

export function TwitterShareCard({
  depositTxHash,
  fromChainId,
  toChainId,
  fromBridgePagePayload,
}: TwitterShareProps) {
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

  if (
    !isDefined(fillTxCompletedTime) ||
    !isDefined(fillTxElapsedSeconds) ||
    fillTxElapsedSeconds > SHARE_THRESHOLD_SECONDS
  ) {
    return null;
  }

  const shareUrl = buildTwitterShareUrl({
    time: fillTxElapsedSeconds,
    originChainId: fromChainId,
    destinationChainId: toChainId,
  });

  return (
    <EarnActionCard
      color="aqua"
      backgroundVariant="c"
      title={<Text color="white">Share and win!</Text>}
      subTitle={
        <Text>
          Share your experience on X to enter this week's drawing for{" "}
          <Highlight>1,000 ACX</Highlight> #PoweredByIntents
        </Text>
      }
      LeftIcon={
        <LogoWrapper>
          <Icon />
        </LogoWrapper>
      }
      ActionButton={
        <ButtonWrapper>
          <Button
            size="md"
            textColor="aqua"
            borderColor="aqua-15"
            backgroundColor="black-700"
            onClick={() => {
              window.open(shareUrl, "_blank");
            }}
          >
            Share on <XIcon />
          </Button>
        </ButtonWrapper>
      }
    />
  );
}

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

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled(SecondaryButton)`
  white-space: nowrap;
`;
