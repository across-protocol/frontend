import styled from "@emotion/styled";

import { Text } from "components/Text";

type Props = {
  label: string;
  value: string;
};

export default function StatBox({ label, value }: Props) {
  return (
    <Container>
      <Text color="grey-400">{label}</Text>
      <Text>{value}</Text>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  padding: 16px;
  gap: 4px;

  border: 1px solid #3e4047;
  border-radius: 16px;
`;
