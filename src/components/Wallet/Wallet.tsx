import React from "react";
import styled from "@emotion/styled";
import { SecondaryButton } from "../BaseButton";
import { shortenAddress } from "../../utils";

type Props = {
  account?: string;
  balance: string;
  chainId?: number;
  onWalletConnect?: () => void;
};

const Wallet: React.FC<Props> = ({
  account,
  chainId,
  balance,
  onWalletConnect,
}) => {
  if (!account || !chainId) {
    return (
      <SecondaryButton onClick={onWalletConnect}>
        Connect Wallet
      </SecondaryButton>
    );
  }
  return (
    <Wrapper onClick={onWalletConnect}>
      <Info>
        <div>{balance} ETH</div>
        <div>{networkFromChainId(chainId)}</div>
      </Info>
      <Account>{shortenAddress(account)}</Account>
    </Wrapper>
  );
};

export default Wallet;

const Wrapper = styled.div`
  --radius: 50px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const Account = styled.div`
  background-color: var(--gray);
  color: var(--white);
  display: grid;
  place-items: center;
  padding: 0 30px;
  border-radius: 0 var(--radius) var(--radius) 0;
  border: 1px solid var(--gray);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-transform: capitalize;
  border-radius: var(--radius) 0 0 var(--radius);
  border: 1px solid var(--gray);
  padding: 10px 20px 5px;
  & > div {
    line-height: 1;
  }
  & > div:last-of-type {
    color: var(--gray-light);
  }
`;

function networkFromChainId(chainId: number) {
  switch (chainId) {
    case 1:
      return "mainnet";
    case 10:
      return "optimism";
    default:
      return "unknown";
  }
}
