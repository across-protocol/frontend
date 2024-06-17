import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";
import {
  COLORS,
  QUERIESV2,
  formatUSD,
  formatUnitsWithMaxFractions,
  rewardProgramTypes,
  rewardPrograms,
  rewardProgramsAvailable,
} from "utils";
import GenericOverviewCard from "./GenericOverviewCard";
import { useRewardProgramCard } from "../hooks/useRewardProgramCard";
import { Text } from "components";
import { BigNumber } from "ethers";

type OverviewSectionProps = {
  stakedTokens?: BigNumber;
  largestStakedPool?: {
    name: string;
    logo: string;
    amount: BigNumber;
  };
};

const OverviewSection = ({
  stakedTokens,
  largestStakedPool,
}: OverviewSectionProps) => (
  <SectionWrapper title="Overview">
    <InnerWrapper>
      <InnerWrapperStack>
        <GenericOverviewCard
          upperCard={{
            title: "Total rewards",
          }}
          lowerCard={
            <RewardProgramWrapper>
              {rewardProgramsAvailable.map((program) => (
                <RewardProgramCard
                  program={program}
                  key={rewardPrograms[program].rewardTokenSymbol}
                />
              ))}
            </RewardProgramWrapper>
          }
        />
      </InnerWrapperStack>
      <InnerWrapperStack>
        <GenericOverviewCard
          thinVerticalPadding
          upperCard={{
            title: "$ in staked LP tokens",
            subTitle: (
              <Text size="lg" color="white">
                {stakedTokens?.gt(0) ? `$${formatUSD(stakedTokens)}` : "-"}
              </Text>
            ),
          }}
        />
        <GenericOverviewCard
          thinVerticalPadding
          upperCard={{
            title: "Top pool",
            subTitle: largestStakedPool ? (
              <IconPoolWrapper>
                <PoolLogo src={largestStakedPool.logo} />
                {largestStakedPool.name}
              </IconPoolWrapper>
            ) : (
              "-"
            ),
          }}
        />
      </InnerWrapperStack>
    </InnerWrapper>
  </SectionWrapper>
);

export default OverviewSection;

const RewardProgramCard = ({ program }: { program: rewardProgramTypes }) => {
  const { token, rewardsAmount, primaryColor } = useRewardProgramCard(program);
  return (
    <RewardProgramCardStack>
      <LogoContainer primaryColor={primaryColor}>
        <Logo src={token.logoURI} alt={token.symbol} />
      </LogoContainer>
      <RewardProgramTextStack>
        <Text color="white" size="lg">
          {formatUnitsWithMaxFractions(rewardsAmount, token.decimals)}
        </Text>
        <Text color="grey-400" size="md">
          {token.symbol}
        </Text>
      </RewardProgramTextStack>
    </RewardProgramCardStack>
  );
};

const InnerWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 16px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
  }
`;

const InnerWrapperStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex: 1 0 0;

  width: 100%;
`;

const RewardProgramCardStack = styled.div`
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;

  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};
  background: ${COLORS["grey-600"]};

  height: 72px;
`;

const RewardProgramWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
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
`;

const Logo = styled.img`
  height: 24px;
  width: 24px;
`;

const RewardProgramTextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const IconPoolWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PoolLogo = styled.img`
  height: 16px;
  width: 16px;
`;
