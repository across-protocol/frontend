import styled from "@emotion/styled";

const SuperHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30px;
  height: 60px;
  color: var(--color-gray);
  background-color: var(--color-error);
  border-bottom: 1px solid var(--color-gray);

  & button {
    background-color: inherit;
    font-size: inherit;
    color: var(--color-gray);
    text-decoration: underline;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
    display: inline-flex;
    &:hover {
      color: var(--color-black);
    }
  }
`;

export default SuperHeader;
