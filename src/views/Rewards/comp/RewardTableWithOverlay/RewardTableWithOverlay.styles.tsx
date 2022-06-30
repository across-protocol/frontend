import styled from "@emotion/styled";

interface IWrapped {
  isConnected: boolean;
}
export const Wrapper = styled.div<IWrapped>`
  position: relative;
  &:after {
    content: " ";
    z-index: 10;
    display: block;
    position: absolute;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
  }
`;
