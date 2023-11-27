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
          <TitleWrapper>
            <img src={rewardToken.logoURI} alt={rewardToken.symbol} />
            <Text color="light-200">
              {formatUnits(deposit.rewards.amount, rewardToken.decimals)}{" "}
              {rewardToken.symbol}
            </Text>
          </TitleWrapper>
          <Text color="grey-400">
            ${Number(deposit.rewards.usd).toFixed(4)}
          </Text>
        </>
      ) : (
        <Text>-</Text>
      )}
    </StyledRewardsCell>
  );
}

const StyledRewardsCell = styled(BaseCell)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;

  > img {
    width: 16px;
    height: 16px;
  }
`;
