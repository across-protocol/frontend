import styled from "@emotion/styled";
import { Text } from "components/Text";
import { COLORS, QUERIESV2 } from "utils";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-up-right.svg";

type QuickLink = {
  label: string;
  url: string;
  chainName: string;
};

type Props = {
  links: QuickLink[];
};

export function QuickLinksBar({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <Container>
      <Label>Quick Links</Label>
      <LinksWrapper>
        {links.map((link, index) => (
          <LinkButton
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text color="light-200" size="md">
              {link.label}
            </Text>
            <ChainBadge>
              <Text color="grey-400" size="sm">
                {link.chainName}
              </Text>
            </ChainBadge>
            <StyledExternalLinkIcon />
          </LinkButton>
        ))}
      </LinksWrapper>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 20px 24px;
  background: ${COLORS["grey-600"]};
  border-radius: 12px;
  border: 1px solid ${COLORS["grey-500"]};

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px;
  }
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS["grey-400"]};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LinksWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${COLORS["grey-500"]};
  border: 1px solid ${COLORS["grey-400"]};
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${COLORS["grey-400"]};
    border-color: ${COLORS.aqua};
  }

  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
    justify-content: space-between;
  }
`;

const ChainBadge = styled.div`
  padding: 4px 8px;
  background: ${COLORS["grey-600"]};
  border-radius: 4px;
`;

const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  width: 16px;
  height: 16px;
  color: ${COLORS["grey-400"]};
  flex-shrink: 0;
`;
