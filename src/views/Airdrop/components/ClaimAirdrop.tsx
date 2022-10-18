import styled from "@emotion/styled";

import { ReactComponent as AcrossIcon } from "assets/acx.svg";
import { Loader } from "components/Loader";
import { Text } from "components/Text";
import { QUERIESV2 } from "utils";

import { FullWidthButton, InverseButton } from "../Airdrop.styles";
import { BreakdownStats } from "./BreakdownStats";
import { AmountBreakdown } from "../hooks/useAirdropRecipient";

export type Props = {
  isClaiming?: boolean;
  isLoading?: boolean;
  hasClaimed?: boolean;
  discord?: {
    discordName: string;
    discordAvatar?: string;
  };
  amount?: string;
  amountBreakdown?: AmountBreakdown;
  onClickClaim: () => void;
  onClickAddToken: () => void;
};

export function ClaimAirdrop({
  isClaiming,
  isLoading,
  hasClaimed,
  discord,
  amount,
  amountBreakdown,
  onClickAddToken,
  onClickClaim,
}: Props) {
  return (
    <Container>
      <BreakdownCardContainer>
        <BreakdownTitle size="lg">Airdrop breakdown</BreakdownTitle>
        <BreakdownStats
          isLoading={isLoading}
          discord={discord}
          amount={amount}
          amountBreakdown={amountBreakdown}
        />
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
            {/* <h2>{formatUnits(amount || 0, DECIMALS)} ACX</h2> */}
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
  width: 100%;

  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const BreakdownCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  width: 100%;

  background: #3e4047;

  border: 1px solid #4c4e57;
  border-radius: 10px;

  @media ${QUERIESV2.sm.andDown} {
    padding: 0;
  }
`;

const BreakdownTitle = styled(Text)`
  align-self: stretch;
  padding: 16px 24px;

  @media ${QUERIESV2.sm.andDown} {
    padding: 12px;
  }
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

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    text-align: center;
  }
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
