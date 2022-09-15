import styled from "@emotion/styled";
import heroBg from "assets/prelaunch/morphs.png";

import { ReactComponent as UnstyledRotate } from "assets/prelaunch/rotate-3d.svg";

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
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid #4c4e57;
  box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.2);
  border-radius: 24px;
`;

export const Rotate = styled(UnstyledRotate)`
  height: 100px;
`;

export const Title = styled.h2`
  margin-top: 56px;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: ${26 / 16}rem;
  line-height: ${31 / 16}rem;
  text-align: center;
`;

export const Subtitle = styled.h3`
  margin-top: 16px;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  text-align: center;
  color: #c5d5e0;
`;

export const DotStepWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  margin-top: 36px;
  justify-content: center;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36px;
  > button {
    margin: 0 4px;
  }
`;
