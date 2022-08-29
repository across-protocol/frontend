import styled from "@emotion/styled";

import { ReactComponent as ClaimHeartWave } from "assets/claim-heart-wave.svg";
import { ReactComponent as AcrossIcon } from "assets/acx.svg";
import { Loader } from "components/Loader";
import { formatUnits } from "utils/format";

import { LightCard } from "./Card";
import { Button, FullWidthButton } from "../Claim.styles";
import { QUERIESV2 } from "utils";

const DECIMALS = 18;

export type Props = {
  isClaiming?: boolean;
  isLoading?: boolean;
  hasClaimed?: boolean;
  amount?: string;
  amountBreakdown?: {
    liquidity: string;
    bridging: string;
    community: string;
  };
  onClickClaim: () => void;
  onClickAddToken: () => void;
};

export function ClaimAirdrop({
  isClaiming,
  isLoading,
  hasClaimed,
  amount,
  amountBreakdown,
  onClickAddToken,
  onClickClaim,
}: Props) {
  return (
    <Container>
      <ClaimHeartImage />
      <TextContainer>
        <h1>You're awesome!</h1>
        <h6>
          We want to thank you for being part of the community powering the
          cheapest, fastest and most secure cross-bridge protocol.
        </h6>
      </TextContainer>
      <BreakdownCardContainer>
        <BreakdownTitle>Airdrop breakdown</BreakdownTitle>
        <BreakdownStats>
          <BreakdownRow>
            <h6>Liquidity providing</h6>
            <h6>
              {formatUnits(amountBreakdown?.liquidity || 0, DECIMALS)} ACX
            </h6>
          </BreakdownRow>
          <BreakdownRow>
            <h6>Bridging activity</h6>
            <h6>{formatUnits(amountBreakdown?.bridging || 0, DECIMALS)} ACX</h6>
          </BreakdownRow>
          <BreakdownRow>
            <h6>Community reward</h6>
            <h6>
              {formatUnits(amountBreakdown?.community || 0, DECIMALS)} ACX
            </h6>
          </BreakdownRow>
          <BreakdownTotalRow>
            <h6>Total reward</h6>
            <h6>{formatUnits(amount || 0, DECIMALS)} ACX</h6>
          </BreakdownTotalRow>
        </BreakdownStats>
      </BreakdownCardContainer>
      {isLoading ? (
        <CenteredLoaderContainer>
          <Loader />
        </CenteredLoaderContainer>
      ) : hasClaimed ? (
        <AddTokenToWalletContainer>
          <AcrossIcon />
          <ClaimedTokensContainer>
            <h6>Claimed tokens</h6>
            <h2>{formatUnits(amount || 0, DECIMALS)} ACX</h2>
          </ClaimedTokensContainer>
          <InverseButton size="lg" onClick={onClickAddToken}>
            Add token to wallet
          </InverseButton>
        </AddTokenToWalletContainer>
      ) : (
        <FullWidthButton size="lg" disabled={isClaiming} onClick={onClickClaim}>
          {isClaiming ? (
            <>
              Claiming airdrop... <Loader />
            </>
          ) : (
            "Claim airdrop"
          )}
        </FullWidthButton>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;

  @media ${QUERIESV2.sm} {
    gap: 32px;
  }
`;

const ClaimHeartImage = styled(ClaimHeartWave)`
  height: 200px;
  width: 218px;
  margin-top: 48px;
`;

const TextContainer = styled.div`
  text-align: center;
  h6 {
    margin-top: 16px;
    color: #c5d5e0;
  }
`;

const BreakdownCardContainer = styled(LightCard)`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  padding: 0;

  @media ${QUERIESV2.sm} {
    padding: 0;
  }
`;

const BreakdownTitle = styled.h6`
  align-self: stretch;
  padding: 16px 24px;

  @media ${QUERIESV2.sm} {
    padding: 12px;
  }
`;

const BreakdownStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: stretch;
  padding: 16px 24px;
  border-top: 1px solid #4c4e57;

  @media ${QUERIESV2.sm} {
    padding: 12px;
  }
`;

const BreakdownRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: #9daab2;
`;

const BreakdownTotalRow = styled(BreakdownRow)`
  border-top: 1px solid #4c4e57;
  margin-top: 8px;
  padding-top: 16px;
  color: inherit;
`;

const AddTokenToWalletContainer = styled.div`
  display: flex;
  align-self: stretch;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  svg {
    height: 48px;
    width: 48px;
  }

  @media ${QUERIESV2.sm} {
    flex-direction: column;
    text-align: center;
  }
`;

const InverseButton = styled(Button)`
  border: 1px solid #6cf9d8;
  color: #6cf9d8;
  background: transparent;
`;

const ClaimedTokensContainer = styled.div`
  flex: 1;
  h6 {
    color: #9daab2;
  }
  h2 {
    color: inherit;
  }
`;

const CenteredLoaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 66px;
`;
