import { BigNumber } from "ethers";
import { useRewards } from "../hooks/useRewards";
import GenericOverviewCard from "./GenericOverviewCard";
import { ReactComponent as Icon } from "assets/icons/rewards/graph-within-star.svg";
import { formatUSD } from "utils";
import styled from "@emotion/styled";

const OverviewStakingCard = () => {
  const { stakedTokens, largestStakedPool } = useRewards();
  const formatUsd = (value: BigNumber) => `$${formatUSD(value)}`;
  return (
    <GenericOverviewCard
      upperCard={{
        title: formatUsd(stakedTokens ?? BigNumber.from(0)),
        subTitle: "$ in staked LP tokens",
      }}
      lowerCard={{
        left: {
          title: largestStakedPool ? (
            <IconPoolWrapper>
              <PoolLogo src={largestStakedPool.logo} />
              {largestStakedPool.name}
            </IconPoolWrapper>
          ) : (
            "-"
          ),
          subTitle: "Top Pool",
        },
        right: {
          title: formatUsd(largestStakedPool?.amount ?? BigNumber.from(0)),
          subTitle: "Staked amount",
        },
      }}
      Icon={Icon}
    />
  );
};

export default OverviewStakingCard;

const IconPoolWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PoolLogo = styled.img`
  height: 16px;
  width: 16px;
`;
