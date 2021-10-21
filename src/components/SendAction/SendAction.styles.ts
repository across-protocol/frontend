import styled from "@emotion/styled";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px 0;
`;

export const Info = styled.div`
  display: flex;
  justify-content: space-between;

  &:not(:last-of-type) {
    margin-bottom: 16px;
  }
  &:last-of-type {
    margin-bottom: 32px;
  }
`;
