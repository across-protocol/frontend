import styled from "@emotion/styled";

export const Wrapper = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  display: flex;
  justify-content: center;
  > div {
    span:first-of-type {
      color: #9daab2;
    }
    span:nth-of-type(2) {
      margin-left: 4px;
      a {
        text-decoration: none;
        color: #e0f3ff;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
`;
