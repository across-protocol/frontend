import styled from "@emotion/styled";
import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  label: string;
  txHash: string;
  explorerLink: string;
};

export function TxDetailSection({ label, txHash, explorerLink }: Props) {
  const shortenHash = (hash: string) =>
    hash.length <= 13 ? hash : `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <DetailSection>
      <SectionLabel>{label}</SectionLabel>
      <TxLink href={explorerLink} target="_blank" rel="noreferrer">
        <Text color="aqua">{shortenHash(txHash)}</Text>
      </TxLink>
    </DetailSection>
  );
}

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS["grey-400"]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const TxLink = styled.a`
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;
