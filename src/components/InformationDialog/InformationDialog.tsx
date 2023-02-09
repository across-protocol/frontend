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
        <ArticleTitle>Time to Destination</ArticleTitle>
        <Text>
          The estimated amount of time expected to receive your funds. If you do
          not receive your funds within the estimated amount of time, please
          visit the ‘across-support’ channel within the{" "}
          <Link
            href="https://discord.across.to"
            target="_blank"
            rel="noopener noreferrer"
          >
            Across Discord.
          </Link>
        </Text>
      </Info>
      <Info>
        <ArticleTitle>Destination Gas Fee</ArticleTitle>
        <Text>
          In order for Across to deliver the tokens to the user on the
          destination chain, a transaction needs to be submitted on behalf of
          the user on the destination chain. The destination gas fee encompasses
          the gas costs associated with this transaction.
        </Text>
      </Info>
      <Info>
        <ArticleTitle>Bridge Fee</ArticleTitle>
        <Text>
          The bridge fee paid by the user consists of two components: <br />{" "}
          <br />
          1. LP fee: A fee that is paid to liquidity providers for providing
          passive liquidity in the unified L1 pools <br />
          2. Relayer fee: A fee that is paid to bridge relayers to incentivize
          them to promptly relay a bridge transaction
        </Text>
      </Info>

      <List>
        <li>
          Click{" "}
          <Link
            href="https://docs.across.to/how-across-works/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </Link>{" "}
          to learn more about the role of relayers
        </li>
        <li>
          Click{" "}
          <Link
            href="https://docs.across.to/how-across-works/fees"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </Link>{" "}
          for more information about fees
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
          to learn more about gas fees
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
