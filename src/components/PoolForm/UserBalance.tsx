import { ethers } from "ethers";
import { FC } from "react";
import styled from "@emotion/styled";

interface Props {
  symbol: string;
  balance: ethers.BigNumber;
}

const UserBalance: FC<Props> = ({ symbol, balance }) => {
  return (
    <UserBalanceWrapper>
      <Balance>
        Balance: {balance.toString()} {symbol}
      </Balance>
    </UserBalanceWrapper>
  );
};

export default UserBalance;

const UserBalanceWrapper = styled.div`
  display: flex;
  align-items: flex-end;
`;

const Balance = styled.span``;
