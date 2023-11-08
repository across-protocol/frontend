import styled from "@emotion/styled";
import { COLORS, QUERIESV2, TokenInfo, formatUnits } from "utils";
import { Text } from "components";
import { ReactComponent as ChevronRight } from "assets/icons/arrow-right-16.svg";
import { useRewardProgramCard } from "../hooks/useRewardProgramCard";
import { Link } from "react-router-dom";

type RewardProgramCardProps = {
  token: TokenInfo;
};

const RewardProgramCard = ({ token }: RewardProgramCardProps) => {
  const { programName, rewardsAmount, primaryColor, backgroundUrl, url } =
    useRewardProgramCard(token);

  return (
    <Wrapper primaryColor={primaryColor} backgroundUrl={backgroundUrl}>
      <LogoContainer primaryColor={primaryColor}>
        <Logo src={token.logoURI} alt={token.symbol} />
      </LogoContainer>
      <TextStack>
        <Text color="white" size="lg">
          {programName}
        </Text>
        <Text color="grey-400" size="md">
          {formatUnits(rewardsAmount, token.decimals)} {token.symbol} earned
        </Text>
      </TextStack>
      <StyledCopyButton to={url} primaryColor={primaryColor}>
        <ChevronRight />
      </StyledCopyButton>
    </Wrapper>
  );
};

export default RewardProgramCard;

const Wrapper = styled.div<{ primaryColor: string; backgroundUrl: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
  align-self: stretch;
  padding: 24px 16px;
  border-radius: 8px;
  border: 1px solid
    ${({ primaryColor }) => COLORS[`${primaryColor}-15` as keyof typeof COLORS]};
  background: url(${({ backgroundUrl }) => backgroundUrl}) no-repeat;
  background-position: top;
  background-size: cover;

  @media ${QUERIESV2.sm.andDown} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    align-self: stretch;
    padding: 24px;
  }
`;

const Logo = styled.img`
  height: 24px;
  width: 24px;
`;

const LogoContainer = styled.div<{ primaryColor: string }>`
  // Layout
  display: flex;
  padding: 8px;
  align-items: flex-start;
  // Colors
  border-radius: 32px;
  border: 1px solid ${COLORS["grey-400-15"]};
  background: ${({ primaryColor }) =>
    COLORS[`${primaryColor}-5` as keyof typeof COLORS]};
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

const StyledCopyButton = styled(Link)<{ primaryColor: string }>`
  display: flex;
  height: 40px;
  width: 40px;
  padding: 0px;
  justify-content: center;
  align-items: center;
  gap: 4px;

  background-color: transparent;

  border-radius: 32px;
  border: 1px solid ${COLORS["grey-500"]};

  cursor: pointer;
  * {
    cursor: pointer;
  }
`;
