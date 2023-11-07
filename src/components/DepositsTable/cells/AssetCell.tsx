import styled from "@emotion/styled";

import { Text } from "components/Text";
import { QUERIESV2, Token } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  token: Token;
  width: number;
};

export function AssetCell({ token, width }: Props) {
  return (
    <StyledAssetCell width={width}>
      <img src={token.logoURI} alt="" />
      <Text color="light-200">{token.symbol}</Text>
    </StyledAssetCell>
  );
}

const StyledAssetCell = styled(BaseCell)`
  gap: 24px;

  img {
    width: 32px;
    height: 32px;
  }

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;

    img {
      width: 24px;
      height: 24px;
    }
  }
`;
