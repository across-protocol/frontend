import styled from "@emotion/styled";

import { ReactComponent as EthIcon } from "assets/eth-white.svg";
import { ReactComponent as AcxIcon } from "assets/acx.svg";

import { EarnOptionCard } from "./EarnOptionCard";

const OPTIONS = [
  {
    MainIcon: <EthIcon />,
    SmallIcon: <AcxIcon />,
    title: "ACX/ETH Liquidity",
    subTitle: "Provide liquidity in the ACX/ETH pool and stake your LP tokens",
    buttonLabel: "Pool ACX/ETH",
    href: "/", // TODO: replace with Uniswap link ACT/ETH
    apyRange: [5, 6],
  },
  {
    MainIcon: <AcxIcon />,
    title: "Stake Across LP Tokens",
    subTitle: "Provide liquidity on Across and stake your LP tokens",
    buttonLabel: "Stake",
    href: "/rewards/staking",
    apyRange: [5, 6],
  },
];

export function WaysToEarn() {
  return (
    <>
      <Title>More ways to earn ACX</Title>
      <SubTitle>
        Did you know that you can provide liquidity to earn ACX? Across offers
        reward locking which increases your APY the longer you provide
        liquidity.
      </SubTitle>
      <OptionsContainer>
        {OPTIONS.map((option) => (
          <EarnOptionCard key={option.title} {...option} />
        ))}
      </OptionsContainer>
    </>
  );
}

const Title = styled.h1`
  text-align: center;
  margin-bottom: ${16 / 16}rem;
`;

const SubTitle = styled.h6`
  text-align: center;
  margin-bottom: 48px;
`;

const OptionsContainer = styled.div`
  gap: 16px;
  display: flex;
  flex-direction: column;
`;
