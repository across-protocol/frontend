import { useParams } from "react-router-dom";
import styled from "@emotion/styled";
import { useDepositStatus } from "hooks";
import { COLORS } from "utils";

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const { data, isLoading, error } = useDepositStatus(depositTxnRef);

  if (isLoading) {
    return (
      <Wrapper>
        <Container>
          <Title>Loading transaction...</Title>
        </Container>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <Container>
          <Title>Error loading transaction</Title>
          <ErrorText>{String(error)}</ErrorText>
        </Container>
      </Wrapper>
    );
  }

  if (!data) {
    return (
      <Wrapper>
        <Container>
          <Title>Transaction not found</Title>
        </Container>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Container>
        <Title>Transaction Details</Title>
        <Section>
          <Label>Status:</Label>
          <Value>{data.status}</Value>
        </Section>
        <Section>
          <Label>Deposit Transaction:</Label>
          <Value>{data.depositTxnRef}</Value>
        </Section>
        <Section>
          <Label>Origin Chain ID:</Label>
          <Value>{data.originChainId}</Value>
        </Section>
        <Section>
          <Label>Destination Chain ID:</Label>
          <Value>{data.destinationChainId}</Value>
        </Section>
        <Section>
          <Label>Deposit ID:</Label>
          <Value>{data.depositId}</Value>
        </Section>
        {data.fillTxnRef && (
          <Section>
            <Label>Fill Transaction:</Label>
            <Value>{data.fillTxnRef}</Value>
          </Section>
        )}
        {data.depositRefundTxnRef && (
          <Section>
            <Label>Refund Transaction:</Label>
            <Value>{data.depositRefundTxnRef}</Value>
          </Section>
        )}
      </Container>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
`;

const Container = styled.div`
  max-width: 800px;
  width: 100%;
  background: ${COLORS["grey-600"]};
  border-radius: 8px;
  padding: 32px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: ${COLORS.white};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  border-bottom: 1px solid ${COLORS["grey-500"]};

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.div`
  font-size: 14px;
  color: ${COLORS["grey-400"]};
  font-weight: 500;
`;

const Value = styled.div`
  font-size: 16px;
  color: ${COLORS.white};
  word-break: break-all;
`;

const ErrorText = styled.div`
  color: ${COLORS["error"]};
  font-size: 14px;
`;
