import styled from "@emotion/styled";
import { BigNumber } from "ethers";

type TokenSelect = {
  chainId: number;
  symbolUri: string;
  symbol: string;
};

type Props = {
  defaultToken: TokenSelect;
  onSelect: (
    token: TokenSelect & {
      priceUsd: BigNumber;
      balance: BigNumber;
      decimals: number;
    }
  ) => void;
};

export default function SelectorButton() {
  return <Wrapper>test</Wrapper>;
}

const Wrapper = styled.div`
  display: flex;
  border-radius: 8px;
  border: 1px solid #3f4247;
  background: #e0f3ff0d;
  padding: 8px 12px;
`;
