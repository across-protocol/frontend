import styled from "@emotion/styled";
import { ReactComponent as Icon } from "assets/icons/reward-lg.svg";
import { BigNumber } from "ethers";
import { formatUSD } from "utils";
import { useRewards } from "../hooks/useRewards";
import GenericOverviewCard from "./GenericOverviewCard";
import { ReactComponent as Icon } from "assets/icons/lp-lg.svg";
import { formatUSD } from "utils";
import styled from "@emotion/styled";
import { utils } from "@across-protocol/sdk-v2";

const OverviewStakingCard = () => {
  const { stakedTokens, largestStakedPool } = useRewards();
  const formatUsd = (value: BigNumber) => `$${formatUSD(value)}`;
  return (
    <GenericOverviewCard
      upperCard={{
        title: stakedTokens?.gt(0) ? formatUsd(stakedTokens) : "-",
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
          title: largestStakedPool ? formatUsd(largestStakedPool.amount) : "-",
          subTitle: "Staked amount",
        },
      }}
      Icon={<Icon />}
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
