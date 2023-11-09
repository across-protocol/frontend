import styled from "@emotion/styled";

import { Text } from "components/Text";
import { Deposit } from "hooks/useDeposits";

import { BaseCell } from "./BaseCell";
import { formatUnits, getToken } from "utils";

type Props = {
  deposit: Deposit;
  width: number;
};

export function RewardsCell({ deposit, width }: Props) {
  const rewardToken = deposit.rewards
    ? getToken(deposit.rewards?.type === "op-rebates" ? "OP" : "ACX")
    : undefined;

  return (
    <StyledRewardsCell width={width}>
      {deposit.rewards && rewardToken ? (
        <>
          <img src={rewardToken.logoURI} alt={rewardToken.symbol} />
          <Text color="light-200">
            {formatUnits(deposit.rewards.amount, rewardToken.decimals)}{" "}
            {rewardToken.symbol}
          </Text>
          <Text color="grey-400">${formatUnits(deposit.rewards.usd, 18)}</Text>
        </>
      ) : (
        <Text>-</Text>
      )}
    </StyledRewardsCell>
  );
}

const StyledRewardsCell = styled(BaseCell)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  > img {
    width: 16px;
    height: 16px;
  }
`;
