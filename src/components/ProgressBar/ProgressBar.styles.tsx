import styled from "@emotion/styled";

export const Wrapper = styled.div`
  /* display: flex; */
  height: 16px;
  width: 100%;
  background-color: #2d2e33;
  border-radius: 20px;
  border: 1px solid #fff;
`;

interface IStyledProgress {
  width: number;
}

export const StyledProgress = styled.div<IStyledProgress>`
  height: 10px;
  width: ${({ width }) => {
    return `${width}%`;
  }};
  background-color: #ffffff;
  border-radius: 20px;
  text-align: right;
  padding: 2px;
  margin: 2px;
`;
