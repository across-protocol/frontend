import React from "react";
import styled from "@emotion/styled";
import { Check, ArrowUpRight } from "react-feather";
import { PrimaryButton } from "../BaseButton";
import type { Transfer } from "state/transfers";

import { COIN_LIST, CHAINS } from "utils";

type Props = {
  onClose: () => void;
} & Transfer;
const Confirmation: React.FC<Props> = ({
  onClose,
  txHash,
  fromAddress,
  fromChain,
  toAddress,
  toChain,
  amount,
  asset,
}) => {
  return (
    <Wrapper>
      <Section>
        <Heading>Deposit succeeded</Heading>
        <SuccessIcon>
          <Check strokeWidth={4} />
        </SuccessIcon>
      </Section>
      <AccentSection>
        <Link
          href={CHAINS[fromChain].constructExplorerLink(txHash)}
          target="_blank"
          rel="noopener norefferrer"
        >
          Etherscan <ArrowUpRight width={16} height={16} />
        </Link>
        <div>
          <Info>
            <h3>Sending</h3>
            <div>
              <img src="" alt={`${2} logo`} />
              <div>
                {amount}{" "}
                {COIN_LIST[fromChain].find((coin) => coin.address === asset)}
              </div>
            </div>
          </Info>
          <Info>
            <h3>From</h3>
            <div>
              <img
                src={CHAINS[fromChain].logoURI}
                alt={`${CHAINS[fromChain].name} logo`}
              />
              <div>{fromAddress}</div>
            </div>
          </Info>
          <Info>
            <h3>To</h3>
            <div>
              <img
                src={CHAINS[toChain].logoURI}
                alt={`${CHAINS[toChain].name} logo`}
              />
              <div>{toAddress}</div>
            </div>
          </Info>
          <Info>
            <h3>ETA to Ethereum Mainnet</h3>
            <div>
              <div>~2 minutes</div>
            </div>
          </Info>
        </div>
        <Button onClick={onClose}>Close</Button>
      </AccentSection>
    </Wrapper>
  );
};

export default Confirmation;

const Wrapper = styled.section`
  height: 100%;
  padding-top: 50px;
`;

const Heading = styled.h1`
  font-weight: bold;
  font-size: ${30 / 16}rem;
  margin-bottom: 36px;
`;

const SuccessIcon = styled.div`
  background-color: var(--primary);
  color: var(--gray);
  border-radius: 99px;
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
`;

const Section = styled.section`
  --horizontalPadding: 30px;

  padding: 35px var(--horizontalPadding);
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const AccentSection = styled(Section)`
  background-image: linear-gradient(var(--primary-dark), var(--gray));
  color: var(--transparent-white);
  border-right: 1px solid var(--gray);
  border-left: 1px solid var(--gray);
  font-size: ${16 / 16}rem;
  display: block;
  flex: 1;
`;

const Button = styled(PrimaryButton)`
  font-size: ${22 / 16}rem;
  font-weight: bold;
  width: 100%;
  margin-top: 24px;
`;

const Info = styled.article`
  border-bottom: 1px solid var(--primary-dark);
  margin: 0 calc(-1 * var(--horizontalPadding));
  padding: 15px var(--horizontalPadding);
`;

const Link = styled.a`
  color: var(--primary);
  cursor: pointer;
  display: block;
  width: fit-content;
  margin: auto;

  &:hover {
    text-decoration: underline;
  }
`;
