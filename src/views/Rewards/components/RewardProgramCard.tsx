import styled from "@emotion/styled";
import { COLORS, QUERIESV2, TokenInfo, formatUnits } from "utils";
import CloudBackground from "assets/bg-banners/cloud-staking.svg";
import { PrimaryButton, Text } from "components";
import { useReferralSummary } from "hooks/useReferralSummary";
import { useConnection } from "hooks";

type RewardProgramCardProps = {
  token: TokenInfo;
};

const RewardProgramCard = ({ token }: RewardProgramCardProps) => {
  const { account } = useConnection();
  // For now, we can only assume that the token is ACX
  const {
    summary: { rewardsAmount },
  } = useReferralSummary(account);
  const programName =
    token.symbol === "ACX" ? "Across Referral Program" : "OP Rewards Program";

  return (
    <Wrapper>
      <LogoContainer>
        <img src={token.logoURI} alt={token.symbol} />
      </LogoContainer>
      <TextStack>
        <Text color="white" size="lg">
          {programName}
        </Text>
        <Text color="grey-400" size="md">
          {formatUnits(rewardsAmount, token.decimals)} {token.symbol} earned
        </Text>
      </TextStack>
      <StyledCopyButton
        onClick={() => {}}
        size="md"
        backgroundColor="black-700"
        textColor="aqua"
      >
        &gt;
      </StyledCopyButton>
    </Wrapper>
  );
};

export default RewardProgramCard;
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
  align-self: stretch;
  padding: 24px 16px;
  border-radius: 8px;
  border: 1px solid ${COLORS["aqua-15"]};
  background: url(${CloudBackground}) no-repeat;
  @media ${QUERIESV2.sm.andDown} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    padding: 16px;
  }
`;

const LogoContainer = styled.div`
  // Layout
  display: flex;
  padding: 8px;
  align-items: flex-start;
  // Colors
  border-radius: 32px;
  border: 1px solid ${COLORS["grey-400"]};
  background: ${COLORS["grey-400"]};
  box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.08),
    0px 2px 6px 0px rgba(0, 0, 0, 0.08);
  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
`;

const StyledCopyButton = styled(PrimaryButton)`
  border: 1px solid ${COLORS["aqua-15"]};
  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;
