import styled from "@emotion/styled";
import { DateTime } from "luxon";
import { useState, useEffect } from "react";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";

type Props = {
  deposit: Deposit;
  width: number;
};

function getTimeAgoText(seconds: number): string {
  const now = DateTime.now();
  const depositTime = DateTime.fromSeconds(seconds);
  const diff = now.diff(depositTime, ["minutes", "seconds"]).toObject();

  const totalSeconds = Math.floor(diff.seconds || 0);
  const totalMinutes = Math.floor((diff.minutes || 0) + totalSeconds / 60);

  if (totalMinutes === 0) {
    return "a few seconds ago";
  } else if (totalMinutes < 3) {
    return `${totalMinutes}m ago`;
  } else {
    // After 3 minutes, show the actual date/time
    return depositTime.toFormat("dd LLL, hh:mm a");
  }
}

export function TimeAgoCell({ deposit, width }: Props) {
  const [timeAgoText, setTimeAgoText] = useState(() =>
    getTimeAgoText(deposit.depositTime)
  );

  // Update every second for live time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgoText(getTimeAgoText(deposit.depositTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [deposit.depositTime]);

  const fullDateTime = DateTime.fromSeconds(deposit.depositTime).toFormat(
    "dd LLL yyyy, hh:mm:ss a"
  );

  return (
    <StyledTimeAgoCell width={width} title={fullDateTime}>
      <Text color="light-200" size="sm">
        {timeAgoText}
      </Text>
    </StyledTimeAgoCell>
  );
}

const StyledTimeAgoCell = styled(BaseCell)`
  display: flex;
  align-items: center;
  position: relative;
  cursor: help;
`;
