import { useHistory, useParams } from "react-router-dom";
import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { IconPair } from "components/IconPair";
import { useDepositByTxHash } from "hooks/useDepositStatus";

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const {
    data: depositData,
    isLoading,
    error,
  } = useDepositByTxHash(depositTxnRef);
  const history = useHistory();
  const config = getConfig();

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

  if (!depositData) {
    return (
      <Wrapper>
        <Container>
          <Title>Transaction not found</Title>
        </Container>
      </Wrapper>
    );
  }

  const deposit = depositData.deposit;
  const sourceChainId = parseInt(deposit.originChainId);
  const destinationChainId = parseInt(deposit.destinationChainId);

  const sourceChain = getChainInfo(sourceChainId);
  const destinationChain = getChainInfo(destinationChainId);

  // Get token info from the deposit data
  const inputToken = config.getTokenInfoByAddressSafe(
    sourceChainId,
    deposit.inputToken
  );
  const outputToken = config.getTokenInfoByAddressSafe(
    destinationChainId,
    deposit.outputToken
  );

  return (
    <Wrapper>
      <Container>
        <Header>
          <BackButton onClick={() => history.goBack()}>← Back</BackButton>
          <Title>Transaction Details</Title>
        </Header>

        <DetailsGrid>
          <DetailSection>
            <SectionLabel>Status</SectionLabel>
            <StatusBadge status={deposit.status}>
              <Text color="light-200" size="lg">
                {deposit.status.charAt(0).toUpperCase() +
                  deposit.status.slice(1)}
              </Text>
            </StatusBadge>
          </DetailSection>

          {inputToken && outputToken && (
            <DetailSection>
              <SectionLabel>Asset</SectionLabel>
              <AssetInfo>
                <IconPair
                  LeftIcon={
                    <img src={inputToken.logoURI} alt={inputToken.symbol} />
                  }
                  RightIcon={
                    <img src={outputToken.logoURI} alt={outputToken.symbol} />
                  }
                  iconSize={32}
                />
                <div>
                  <Text color="light-200" size="lg">
                    {inputToken.symbol} → {outputToken.symbol}
                  </Text>
                </div>
              </AssetInfo>
            </DetailSection>
          )}

          <DetailSection>
            <SectionLabel>Route</SectionLabel>
            <RouteInfo>
              <IconPair
                LeftIcon={
                  <img src={sourceChain.logoURI} alt={sourceChain.name} />
                }
                RightIcon={
                  <img
                    src={destinationChain.logoURI}
                    alt={destinationChain.name}
                  />
                }
                iconSize={32}
              />
              <div>
                <Text color="light-200" size="lg">
                  {sourceChain.name} → {destinationChain.name}
                </Text>
              </div>
            </RouteInfo>
          </DetailSection>

          <DetailSection>
            <SectionLabel>Deposit ID</SectionLabel>
            <Text color="light-200">{deposit.depositId}</Text>
          </DetailSection>

          <DetailSection>
            <SectionLabel>Deposit Transaction</SectionLabel>
            <TxLink
              href={sourceChain.constructExplorerLink(deposit.depositTxnRef)}
              target="_blank"
              rel="noreferrer"
            >
              <Text color="aqua">{formatTxHash(deposit.depositTxnRef)}</Text>
            </TxLink>
          </DetailSection>

          {deposit.fillTx && (
            <DetailSection>
              <SectionLabel>Fill Transaction</SectionLabel>
              <TxLink
                href={destinationChain.constructExplorerLink(deposit.fillTx)}
                target="_blank"
                rel="noreferrer"
              >
                <Text color="aqua">{formatTxHash(deposit.fillTx)}</Text>
              </TxLink>
            </DetailSection>
          )}

          {deposit.depositRefundTxnRef && (
            <DetailSection>
              <SectionLabel>Refund Transaction</SectionLabel>
              <TxLink
                href={sourceChain.constructExplorerLink(
                  deposit.depositRefundTxnRef
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Text color="aqua">
                  {formatTxHash(deposit.depositRefundTxnRef)}
                </Text>
              </TxLink>
            </DetailSection>
          )}
        </DetailsGrid>
      </Container>
    </Wrapper>
  );
}

function formatTxHash(hash: string): string {
  if (hash.length <= 13) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
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

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: ${COLORS["grey-400"]};
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover {
    color: ${COLORS["light-200"]};
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

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS["grey-400"]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 8px;
  background: ${({ status }) =>
    status === "filled"
      ? `${COLORS.aqua}20`
      : status === "pending"
        ? `${COLORS.yellow}20`
        : `${COLORS["grey-500"]}`};
  border: 1px solid
    ${({ status }) =>
      status === "filled"
        ? COLORS.aqua
        : status === "pending"
          ? COLORS.yellow
          : COLORS["grey-400"]};
`;

const AssetInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const RouteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TxLink = styled.a`
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ErrorText = styled.div`
  color: ${COLORS["error"]};
  font-size: 14px;
`;
