import styled from "@emotion/styled";

export const Wrapper = styled.div`
  width: 100%;
  padding-bottom: 2rem;
`;

export const PaginationElements = styled.div`
  display: flex;
  width: 200px;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
`;

interface IElementWrapper {
  active?: boolean;
}

export const ElementWrapper = styled.div<IElementWrapper>`
  /* background-color: #2c2e32; */
  background-color: ${({ active }) => (active ? "#6DF8D8" : "#2c2e32")};
  /* color: #6df8d8; */
  color: ${({ active }) => (active ? "#2c2e32" : "#6DF8D8")};
  border: 1px solid #6df8d8;
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
    background-color: #364c4c;
    cursor: pointer;
  }
`;
