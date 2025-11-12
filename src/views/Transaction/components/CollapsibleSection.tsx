import styled from "@emotion/styled";
import { useState } from "react";
import { Text } from "components/Text";
import { COLORS, QUERIESV2 } from "utils";
import { ReactComponent as ChevronIcon } from "assets/icons/chevron-down.svg";

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
        <Title>{title}</Title>
        <StyledChevronIcon isOpen={isOpen} />
      </HeaderButton>
      {isOpen && <ContentWrapper>{children}</ContentWrapper>}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const HeaderButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 0px 12px;
  }
`;

const Title = styled(Text)`
  color: #9daab2;
  text-align: left;
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
