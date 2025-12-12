import styled from "@emotion/styled";
import { COLORS, QUERIESV2 } from "utils";

type Props = {
  title: string;
  error?: string;
};

export function CenteredMessage({ title, error }: Props) {
  return (
    <Wrapper>
      <Container>
        <Title>{title}</Title>
        {error && <ErrorText>{error}</ErrorText>}
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
  background: ${COLORS["black-900"]};

  @media ${QUERIESV2.sm.andDown} {
    padding: 20px 12px;
  }
`;

const Container = styled.div`
  max-width: 900px;
  width: 100%;
  background: ${COLORS["grey-600"]};
  border-radius: 12px;
  padding: 32px;
  border: 1px solid ${COLORS["grey-500"]};

  @media ${QUERIESV2.sm.andDown} {
    padding: 20px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${COLORS.white};
  margin: 0;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 24px;
  }
`;

const ErrorText = styled.div`
  color: ${COLORS["error"]};
  font-size: 14px;
`;
