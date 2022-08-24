import styled from "@emotion/styled";
import { Loader as LoaderIcon } from "react-feather";

type Props = {
  size?: number;
};

export const Loader = styled(LoaderIcon)`
  width: ${(props: Props) => props.size || 24}px;
  height: ${(props: Props) => props.size || 24}px;
  animation: rotation 2s infinite linear;
  align-self: flex-end;

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
