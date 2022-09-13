import styled from "@emotion/styled";
import heroBg from "assets/prelaunch/morphs.png";

import { ReactComponent as Rotate } from "assets/prelaunch/rotate-3d.svg";

export const Wrapper = styled.div`
  min-height: calc(100% - 72px);
`;

export const HeroBlock = styled.div`
  height: 250px;
  width: 250px;
  background-image: url(${heroBg});
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledRotate = styled(Rotate)`
  height: 100px;
`;
