import React from "react";
import styled from "@emotion/styled";
import Dialog from "../Dialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const InformationDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <Title>Information</Title>
      <Info>
        <ArticleTitle>Time to Ethereum Mainnet</ArticleTitle>
        <Text>
          The estimated amount of time expected to receive your funds on
          Ethereum Mainnet. If you do not receive your funds within the
          estimated amount of time, please visit the ‘across-support’ channel
          within the{" "}
          <Link
            href="https://discord.gg/across"
            target="_blank"
            rel="noopener noreferrer"
          >
            Across Discord.
          </Link>
        </Text>
      </Info>
      <Info>
        <ArticleTitle>Bridge Fee</ArticleTitle>
        <Text>
          Assets are transferred near instantly by utilizing funds from a
          liquidity pool. The bridge fee is comprised of a liquidity provider
          fee that rewards liquidity providers on Across.
        </Text>
      </Info>
      <Info>
        <ArticleTitle>Gas Fee</ArticleTitle>
        <Text>
          Across sends funds by default via an instant relay. If an instant
          relay is unavailable, a slow relay will occur. Instant and slow
          relayers charge a fee for performing the relay. These fees are
          dependent on Ethereum Gas fees. View here to learn more about Ethereum
          gas fees.
        </Text>
      </Info>

      <List>
        <li>
          Click{" "}
          <Link
            href="https://across.gitbook.io/bridge/how-does-across-work-1/architecture-process-walkthrough"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </Link>{" "}
          to learn more about instant and slow relayers.
        </li>
        <li>
          Click{" "}
          <Link
            href="https://across.gitbook.io/bridge/how-does-across-work-1/fees"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </Link>{" "}
          or more information on Across fees.
        </li>
        <li>
          Click{" "}
          <Link
            href="https://ethereum.org/en/developers/docs/gas/"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </Link>{" "}
          to learn more about Ethereum gas fees.
        </li>
      </List>
    </Dialog>
  );
};
export default InformationDialog;

const Title = styled.h1`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 25px;
`;

const Info = styled.article`
  margin-bottom: 20px;
  font-size: ${14 / 16}rem;
`;

const ArticleTitle = styled.h2`
  font-weight: bold;
  margin-bottom: 8px;
`;

const Text = styled.p`
  max-width: 65ch;
`;

const Link = styled.a`
  color: var(--color-secondary);
  text-decoration: none;
  transform: opacity 100ms linear;

  &:hover {
    text-decoration: revert;
  }
`;

const List = styled.ul`
  list-style: inside;
  font-size: ${14 / 16}rem;
`;
