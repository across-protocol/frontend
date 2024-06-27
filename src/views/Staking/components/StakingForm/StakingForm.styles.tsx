import styled from "@emotion/styled";
import ProgressBar from "components/ProgressBar";
import { ReactComponent as UnstyledArrowIcon } from "assets/icons/chevron-down.svg";
import { ReactComponent as II } from "assets/icons/info.svg";
import { Divider as ExternalDivider } from "../../Staking.styles";

import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
  box-sizing: border-box;
`;

export const Divider = ExternalDivider;

export const InputWrapper = styled.div`
  flex-grow: 8;
  position: relative;
`;

export const StakeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

interface IInnerPoolStakeInfo {
  visible: boolean;
}
export const InnerPoolStakeInfo = styled(StakeInfo)<IInnerPoolStakeInfo>`
  display: ${({ visible }) => (visible ? `flex` : `none`)};
`;

export const StakeInfoItem = styled.div`
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;

  gap: 4px;

  width: 100%;
  color: #9daab2;

  justify-content: start;
  &:nth-of-type(2n) {
    justify-content: flex-end;
  }

  @media ${QUERIESV2.sm.andDown} {
    &:nth-of-type(2n) {
      justify-content: start;
    }
    font-size: ${14 / 16}rem;
    flex-shrink: 0;
    width: fit-content;
  }
`;

export const StakeInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    gap: 6px;
  }
`;

export const StakeAPYInfoRow = styled(StakeInfoRow)`
  cursor: pointer;
  @media ${QUERIESV2.sm.andDown} {
    flex-direction: row;
    width: 100%;
    gap: 12px;
    & > {
      width: fit-content;
    }
  }
`;

interface IStyledProgressBar {
  active: boolean;
}
export const StyledProgressBar = styled(ProgressBar)<IStyledProgressBar>`
  width: 80px;
  height: 14px;
  padding-right: 4px;
  margin-right: 8px;
  border-color: ${({ active }) => (active ? "#e0f3ff" : "#9daab2")};

  & > div {
    height: 8px;

    background-color: ${({ active }) => (active ? "#e0f3ff" : "#9daab2")};
  }
`;

export const APYInfoItem = styled(StakeInfoItem)`
  gap: 0px;
`;

export const ArrowIconDown = styled(UnstyledArrowIcon)`
  margin-right: 11px;
  path {
    stroke: #9daab2;
  }
`;

export const ArrowIconUp = styled(ArrowIconDown)`
  rotate: 180deg;
  margin-bottom: -4px;
`;

export const InfoIcon = styled(II)`
  margin-left: 8px;
  cursor: pointer;
`;

export const InputBlockWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 12px;
  width: 100%;
  text-align: center;

  > div {
    width: 100%;
  }
`;
