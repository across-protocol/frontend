import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { BaseButton } from "components/Buttons";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: ${16 / 16}rem ${16 / 16}rem 0;

  @media ${QUERIES.mobileAndDown} {
    flex-direction: column;
    align-items: flex-end;
  }
`;

export const PageSizeSelectWrapper = styled.div`
  position: relative;

  @media ${QUERIES.mobileAndDown} {
    margin-bottom: 1rem;
  }
`;

export const PageSizeSelectButton = styled(BaseButton)`
  padding: 10px 20px;
  display: flex;
  align-items: center;
  color: #e0f3ff;
  font-weight: 500;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  border: 1px solid var(--color-pagination);
  border-radius: 20px;

  svg {
    margin-left: 6px;
  }
`;

const PageSelectDropdownRevealAnimation = keyframes`
  from {
    opacity: 0;
    top: 30px;
  }

  to {
    opacity: 1;
    top: 48px;
  }
`;

export const PageSizeSelectDropdown = styled.div`
  position: absolute;
  padding: 4px 0;
  top: 40px;
  left: 0%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-pagination);
  border-radius: 12px;
  overflow: hidden;
  animation: ${PageSelectDropdownRevealAnimation} 0.1s ease-out forwards;
  background-color: var(--color-gray);
`;

export const PageSizeOptiontButton = styled(BaseButton)`
  padding: 6px 20px;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 500;
  color: #e0f3ff;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.1s ease-out, color 0.1s ease-out;

  :hover {
    background-color: var(--color-primary);
    color: var(--color-gray);
  }
`;

export const PaginationElements = styled.div`
  display: flex;
  align-items: center;
  justify-content: right;
  gap: 6px;
  font-weight: 500;
`;

interface IElementWrapper {
  active?: boolean;
}

export const ElementWrapper = styled.div<IElementWrapper>`
  min-width: 40px;
  padding: 8px 14px;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 500;
  color: #e0f3ff;
  text-align: center;
  border: ${({ active }) =>
    active ? "1px solid #ffffff" : "1px solid var(--color-pagination)"};
  border-radius: 20px;
  background-color: var(--color-gray-160);
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }
`;

interface INextWrapper {
  disabled?: boolean;
}

export const NextElement = styled.div<INextWrapper>`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9daab2;
  height: 32px;
  width: 32px;
  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "all")};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  :nth-last-of-type(2) {
    transform: rotate(90deg);
  }

  :last-of-type {
    transform: rotate(-90deg);
  }

  :hover {
    svg path {
      stroke: #e0f3ff;
    }
  }
`;

export const PagesPlaceholder = styled.span`
  margin: 0 8px;
`;
