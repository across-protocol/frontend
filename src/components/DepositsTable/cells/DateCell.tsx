import styled from "@emotion/styled";
import { DateTime } from "luxon";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";

type Props = {
  deposit: Deposit;
  width: number;
};

export function DateCell({ deposit, width }: Props) {
  return (
    <StyledDateCell width={width}>
      <Text color="light-200">
        {DateTime.fromSeconds(deposit.depositTime).toFormat("dd LLL, yyyy")}
      </Text>
      <Text size="sm" color="grey-400">
        {DateTime.fromSeconds(deposit.depositTime).toFormat("hh:mm a")}
      </Text>
    </StyledDateCell>
  );
}

const StyledDateCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
