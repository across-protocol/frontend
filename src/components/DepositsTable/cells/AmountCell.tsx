import styled from "@emotion/styled";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";
import { formatUnits, Token } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  deposit: Deposit;
  token: Token;
  width: number;
};

export function AmountCell({ deposit, token, width }: Props) {
  return (
    <StyledAmountCell width={width}>
      <Text color="light-200">
        {formatUnits(deposit.amount, token.decimals)}
      </Text>
    </StyledAmountCell>
  );
}

const StyledAmountCell = styled(BaseCell)`
  > div {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`;
