import styled from "@emotion/styled";
import { Loader as LoaderIcon } from "react-feather";

type Props = {
  size?: number;
};

export const Loader = styled(LoaderIcon)<Props>`
  width: ${({ size = 24 }) => size}px;
  height: ${({ size = 24 }) => size}px;
  animation: rotation 2s infinite linear;

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(359deg);
    }
  }
`;

export default Loader;
