import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { BaseButton } from "components/Buttons";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 2rem auto 4rem;
  max-width: 1390px;

  @media ${QUERIES.mobileAndDown} {
    flex-direction: column;
    align-items: flex-end;
    margin: 2rem 0 4rem;
  }
`;

export const PageSizeSelectWrapper = styled.div`
  position: relative;

  @media ${QUERIES.mobileAndDown} {
    margin-bottom: 1.5rem;
  }
`;

export const PageSizeSelectButton = styled(BaseButton)`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--color-white);
  line-height: 24px;
  border: 1px solid var(--color-pagination);
  border-radius: 16px;

  svg {
    width: 16px;
    height: 16px;
    margin-left: 8px;
    transform: rotate(90deg);
  }
`;

const PageSelectDropdownRevealAnimation = keyframes`
  from {
    opacity: 0;
    top: 30px;
  }

  to {
    opacity: 1;
    top: 40px;
  }
`;

export const PageSizeSelectDropdown = styled.div`
  position: absolute;
  top: 40px;
  left: 0%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-pagination);
  border-radius: 6px;
  overflow: hidden;
  animation: ${PageSelectDropdownRevealAnimation} 0.1s ease-out forwards;
  background-color: var(--color-gray);
`;

export const PageSizeOptiontButton = styled(BaseButton)`
  padding: 4px 12px;
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--color-white);
  line-height: 24px;
  cursor: pointer;
  border-radius: 0;
  transition: background-color 0.1s ease-out, color 0.1s ease-out;

  :hover {
    background-color: var(--color-primary);
    color: var(--color-gray);
  }
`;

export const PaginationElements = styled.div`
  display: flex;
  /* margin: 0 auto; */
  align-items: center;
  justify-content: right;
`;

interface IElementWrapper {
  active?: boolean;
}

export const ElementWrapper = styled.div<IElementWrapper>`
  background-color: ${({ active }) =>
    active ? "var(--color-pagination)" : "var(--color-gray-160)"};
  color: var(--color-white);
  border: 1px solid var(--color-pagination);
  height: 30px;
  width: 30px;
  border-radius: 6px;
  text-align: center;
  margin: 0 3px;
  font-size: ${16 / 16}rem;
  align-items: center;
  &:hover {
    opacity: 0.7;
    background-color: var(--color-pagination);
    cursor: pointer;
  }
`;

interface INextWrapper {
  disabled?: boolean;
}

export const NextElement = styled.div<INextWrapper>`
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-white);
  height: 32px;
  width: 32px;
  &:hover {
    cursor: pointer;
  }
`;
