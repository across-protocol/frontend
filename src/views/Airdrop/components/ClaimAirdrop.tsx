import styled from "@emotion/styled";

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
      {hasClaimed ? (
        <InverseButton size="lg" onClick={onClickAddToken}>
          Add token contract to wallet
        </InverseButton>
      ) : (
        <FullWidthButton
          size="lg"
          disabled={isClaiming || isLoading}
          onClick={onClickClaim}
        >
          {isClaiming ? "Claiming airdrop..." : "Claim airdrop"}
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
