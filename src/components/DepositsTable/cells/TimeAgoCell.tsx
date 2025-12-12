import styled from "@emotion/styled";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import { getTimeAgoText } from "./getTimeAgoText";

export function TimeAgoCell({
  deposit,
  width,
}: {
  deposit: Deposit;
  width: number;
}) {
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
