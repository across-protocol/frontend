import styled from "@emotion/styled";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";
import { formatUnitsWithMaxFractions, TokenInfo } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  deposit: Deposit;
  token: TokenInfo;
  width: number;
};

export function AmountCell({ deposit, token, width }: Props) {
  const amountToDisplay = deposit.swapTokenAmount || deposit.amount;
  return (
    <StyledAmountCell width={width}>
      <Text color="light-200">
        {formatUnitsWithMaxFractions(amountToDisplay, token.decimals)}
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
