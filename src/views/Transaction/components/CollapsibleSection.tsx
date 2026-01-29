import styled from "@emotion/styled";
import { useState } from "react";
import { Text } from "components/Text";
import { COLORS } from "utils";
import { ReactComponent as ChevronIcon } from "assets/icons/chevron-down.svg";
import {
  SectionCard,
  SectionHeaderCollapsible,
} from "./TransactionSection.styles";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Wrapper>
      <HeaderButton onClick={() => setIsOpen(!isOpen)}>
        <Text color="light-200" size="md" weight={600}>
          {title}
        </Text>
        <StyledChevronIcon isOpen={isOpen} />
      </HeaderButton>
      {isOpen && <ContentWrapper>{children}</ContentWrapper>}
    </Wrapper>
  );
}

const Wrapper = styled(SectionCard)`
  --padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--padding);
  width: 100%;
`;

const HeaderButton = styled(SectionHeaderCollapsible)`
  width: 100%;
`;

const StyledChevronIcon = styled(ChevronIcon)<{ isOpen: boolean }>`
  width: 20px;
  height: 20px;
  color: ${COLORS["grey-400"]};
  transition: transform 0.2s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  flex-shrink: 0;
`;

const ContentWrapper = styled.div`
  width: 100%;
`;
