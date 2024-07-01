import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";
import {
  COLORS,
  QUERIESV2,
  formatUSD,
  formatUnitsWithMaxFractions,
  getToken,
  isDefined,
  rewardProgramTypes,
  rewardProgramsAvailable,
} from "utils";
import GenericOverviewCard from "./GenericOverviewCard";
import { useRewardProgramCard } from "../hooks/useRewardProgramCard";
import { Text } from "components";
import { BigNumber } from "ethers";
import { useHistory } from "react-router-dom";

type OverviewSectionProps = {
  stakedTokens?: BigNumber;
  largestStakedPool?: {
    name: string;
    logo: string;
    amount: BigNumber;
  };
  totalACXRewards?: BigNumber;
};

const OverviewSection = ({
  stakedTokens,
  largestStakedPool,
  totalACXRewards,
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
              {["acx-rewards", ...rewardProgramsAvailable].map((program) => (
                <RewardProgramCard
                  program={
                    (program === "acx-rewards"
                      ? "arb-rebates"
                      : program) as rewardProgramTypes
                  }
                  key={program}
                  acxOverride={
                    program === "acx-rewards" ? totalACXRewards : undefined
                  }
                  enableLink={program !== "acx-rewards"}
                  smallLogo={program !== "acx-rewards"}
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

const RewardProgramCard = ({
  program,
  acxOverride,
  enableLink,
  smallLogo,
}: {
  program: rewardProgramTypes;
  enableLink: boolean;
  smallLogo: boolean;
  acxOverride?: BigNumber;
}) => {
  let { token, rewardsAmount, primaryColor, url } =
    useRewardProgramCard(program);
  const { push: navigate } = useHistory();

  if (isDefined(acxOverride)) {
    token = getToken("ACX");
    rewardsAmount = acxOverride;
    primaryColor = "aqua";
  }
  const onClick = () => {
    if (enableLink) {
      navigate(url);
    }
  };
  return (
    <RewardProgramCardStack onClick={onClick} enableLink={enableLink}>
      <LogoContainer primaryColor={primaryColor} smallLogo={smallLogo}>
        <Logo src={token.logoURI} alt={token.symbol} smallLogo={smallLogo} />
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

const RewardProgramCardStack = styled.div<{ enableLink: boolean }>`
  display: flex;
  padding: 12px;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;

  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};
  background: ${COLORS["grey-600"]};

  height: 72px;

  cursor: ${({ enableLink }) => (enableLink ? "pointer" : "default")};
`;

const RewardProgramWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: column;
    > div {
      width: 100%;
    }
  }
`;

const LogoContainer = styled.div<{ primaryColor: string; smallLogo?: boolean }>`
  // Layout
  display: flex;
  padding: ${({ smallLogo }) => (smallLogo ? 4 : 8)}px;
  align-items: flex-start;
  // Colors
  border-radius: 32px;
  border: 1px solid ${COLORS["grey-400-15"]};
  background: ${({ primaryColor }) =>
    COLORS[`${primaryColor}-5` as keyof typeof COLORS]};
  box-shadow:
    0px 4px 12px 0px rgba(0, 0, 0, 0.08),
    0px 2px 6px 0px rgba(0, 0, 0, 0.08);
`;

const Logo = styled.img<{ smallLogo: boolean }>`
  height: ${({ smallLogo }) => (smallLogo ? 16 : 24)}px;
  width: ${({ smallLogo }) => (smallLogo ? 16 : 24)}px;
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
