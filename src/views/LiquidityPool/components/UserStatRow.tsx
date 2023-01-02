import styled from "@emotion/styled";

import { Text } from "components/Text";

type Props = {
  label: string;
  value: string;
  tokenLogoURI?: string;
};

export default function UserStatBox({ label, value, tokenLogoURI }: Props) {
  return (
    <Container>
      <Text color="grey-400">{label}</Text>
      <ValueContainer>
        <Text color="grey-400">{value} </Text>
        {tokenLogoURI && <img src={tokenLogoURI} alt={label} />}
      </ValueContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ValueContainer = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  img {
    height: 16px;
    width: 16px;
  }
`;
