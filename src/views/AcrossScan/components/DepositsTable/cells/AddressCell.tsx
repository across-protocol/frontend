import styled from "@emotion/styled";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import { shortenAddress } from "utils";
import { useEnsQuery } from "hooks/useEns";

type Props = {
  deposit: Deposit;
  width: number;
};

export function AddressCell({ deposit, width }: Props) {
  const {
    data: { ensName: recipientEns },
  } = useEnsQuery(deposit.recipientAddr);
  const {
    data: { ensName: depositorEns },
  } = useEnsQuery(deposit.depositorAddr);

  return (
    <StyledAddressCell width={width}>
      <Text color="light-200">
        → {recipientEns ?? shortenAddress(deposit.recipientAddr, "...", 4)}
      </Text>
      <Text size="sm" color="grey-400">
        {depositorEns ?? shortenAddress(deposit.depositorAddr, "...", 4)}
      </Text>
    </StyledAddressCell>
  );
}

const StyledAddressCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
