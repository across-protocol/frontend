import { useHistory, useParams } from "react-router-dom";
import styled from "@emotion/styled";
import { COLORS, getChainInfo, getConfig, QUERIESV2 } from "utils";
import { Text } from "components/Text";
import { useDepositByTxHash } from "hooks/useDepositStatus";
import { CenteredMessage } from "./components/CenteredMessage";
import { DetailSection } from "./components/DetailSection";
import { StatusBadge } from "./components/StatusBadge";
import { IconPairDisplay } from "./components/IconPairDisplay";
import { TxDetailSection } from "./components/TxDetailSection";

export default function Transaction() {
  const { depositTxnRef } = useParams<{ depositTxnRef: string }>();
  const {
    data: depositData,
    isLoading,
    error,
  } = useDepositByTxHash(depositTxnRef);
  const history = useHistory();

  if (isLoading) return <CenteredMessage title="Loading transaction..." />;
  if (error)
    return (
      <CenteredMessage
        title="Error loading transaction"
        error={String(error)}
      />
    );
  if (!depositData) return <CenteredMessage title="Transaction not found" />;

  const deposit = depositData.deposit;
  const config = getConfig();

  const sourceChainId = parseInt(deposit.originChainId);
  const destinationChainId = parseInt(deposit.destinationChainId);
  const sourceChain = getChainInfo(sourceChainId);
  const destinationChain = getChainInfo(destinationChainId);

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
          <DetailSection label="Status">
            <StatusBadge status={deposit.status} />
          </DetailSection>

          {inputToken && outputToken && (
            <DetailSection label="Asset">
              <IconPairDisplay
                leftIcon={inputToken.logoURI}
                leftAlt={inputToken.symbol}
                rightIcon={outputToken.logoURI}
                rightAlt={outputToken.symbol}
                label={`${inputToken.symbol} → ${outputToken.symbol}`}
              />
            </DetailSection>
          )}

          <DetailSection label="Route">
            <IconPairDisplay
              leftIcon={sourceChain.logoURI}
              leftAlt={sourceChain.name}
              rightIcon={destinationChain.logoURI}
              rightAlt={destinationChain.name}
              label={`${sourceChain.name} → ${destinationChain.name}`}
            />
          </DetailSection>

          <DetailSection label="Deposit ID">
            <Text color="light-200">{deposit.depositId}</Text>
          </DetailSection>

          <TxDetailSection
            label="Deposit Transaction"
            txHash={deposit.depositTxnRef}
            explorerLink={sourceChain.constructExplorerLink(
              deposit.depositTxnRef
            )}
          />

          {deposit.fillTx && (
            <TxDetailSection
              label="Fill Transaction"
              txHash={deposit.fillTx}
              explorerLink={destinationChain.constructExplorerLink(
                deposit.fillTx
              )}
            />
          )}

          {deposit.depositRefundTxnRef && (
            <TxDetailSection
              label="Refund Transaction"
              txHash={deposit.depositRefundTxnRef}
              explorerLink={sourceChain.constructExplorerLink(
                deposit.depositRefundTxnRef
              )}
            />
          )}
        </DetailsGrid>
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
