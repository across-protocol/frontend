import styled from "@emotion/styled";

import { Text } from "components/Text";
import { QUERIESV2 } from "utils";

import {
  FullWidthButton,
  LinkWithUnderline,
  HighlightedLink,
} from "../Airdrop.styles";
import { BreakdownStats } from "./BreakdownStats";
import { AmountBreakdown } from "../hooks/useAirdropRecipient";

export type Props = {
  isClaiming?: boolean;
  isLoadingAirdrop?: boolean;
  isLoadingClaimed?: boolean;
  hasClaimed?: boolean;
  discord?: Partial<{
    discordName: string;
    discordAvatar: string;
  }> | null;
  amount?: string;
  amountBreakdown?: AmountBreakdown;
  onClickClaim: () => void;
  onClickAddToken: () => void;
  errorMsg?: string;
  maxApyPct?: string;
};

export function ClaimAirdrop({
  isClaiming,
  isLoadingAirdrop,
  isLoadingClaimed,
  hasClaimed,
  discord,
  amount,
  amountBreakdown,
  onClickClaim,
  errorMsg,
  maxApyPct,
}: Props) {
  return (
    <Container>
      <BreakdownCardContainer>
        <BreakdownTitle size="lg">Airdrop breakdown</BreakdownTitle>
        <BreakdownStats
          isLoading={isLoadingAirdrop || isLoadingClaimed}
          discord={discord}
          amount={amount}
          amountBreakdown={amountBreakdown}
        />
      </BreakdownCardContainer>
      <InfoTextContainer>
        <Text size="lg">
          Claimed ACX tokens will be automatically staked in the{" "}
          <HighlightedLink to="/">Rewards Locking Program</HighlightedLink> to
          support bridging ACX cross-chain, and earning up to {maxApyPct ?? "-"}
          % APY. Read more <LinkWithUnderline to="/">here</LinkWithUnderline>.
        </Text>
      </InfoTextContainer>
      {!hasClaimed && (
        <>
          {errorMsg && <Text color="error">{errorMsg}</Text>}
          <FullWidthButton
            size="lg"
            disabled={isClaiming || isLoadingAirdrop || isLoadingClaimed}
            onClick={onClickClaim}
          >
            {isClaiming ? "Claiming airdrop..." : "Claim airdrop"}
          </FullWidthButton>
        </>
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

const InfoTextContainer = styled.div`
  text-align: center;
`;
