import styled from "@emotion/styled";

export const Wrapper = styled.div`
  width: 100%;
  padding-bottom: 2rem;
`;

export const PaginationElements = styled.div`
  display: flex;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
`;

interface IElementWrapper {
  active?: boolean;
}

export const ElementWrapper = styled.div<IElementWrapper>`
  background-color: ${({ active }) =>
    active ? "var(--color-primary)" : "var(--color-gray-250)"};
  color: ${({ active }) =>
    active ? "var(--color-gray-250)" : "var(--color-primary)"};
  border: 1px solid var(--color-primary);
  height: 30px;
  width: 30px;
  border-radius: 6px;
  text-align: center;
  margin: 0 3px;
  font-size: ${16 / 16}rem;
  align-items: center;
  &:first-of-type {
    margin-right: 12px;
  }
  &:last-of-type {
    margin-left: 12px;
  }
  &:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-primary);
    cursor: pointer;
  }
`;
