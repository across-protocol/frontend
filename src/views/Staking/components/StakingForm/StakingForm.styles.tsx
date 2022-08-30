import styled from "@emotion/styled";
import ProgressBar from "components/ProgressBar";
import { ReactComponent as UnstyedUsdcLogo } from "assets/icons/usdc-24.svg";
import { ReactComponent as UnstyledArrowIcon } from "assets/icons/arrow-16.svg";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import {
  Card as ExternalCard,
  Divider as ExternalDivider,
} from "../../Staking.styles";

import { QUERIESV2 } from "utils";

export const Card = styled(ExternalCard)``;

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

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto 0px;
  justify-items: center;
`;

export const Divider = ExternalDivider;

interface ITab {
  active: boolean;
}
export const Tab = styled.div<ITab>`
  flex-grow: 1;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 500;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  color: ${({ active }) => (active ? "#e0f3ff" : "#9DAAB2")};
  text-align: center;
  padding: 0 0 20px;
  border-bottom: ${(props) =>
    props.active ? "2px solid #e0f3ff" : "1px solid #3E4047"};
  cursor: pointer;
`;

export const UsdcLogo = styled(UnstyedUsdcLogo)``;

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

  width: 100%;
  color: #9daab2;

  justify-content: start;
  &:nth-of-type(2n) {
    justify-content: flex-end;
  }

  @media ${QUERIESV2.sm} {
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

  @media ${QUERIESV2.sm} {
    flex-direction: column;
    gap: 6px;
  }
`;

export const StakeAPYInfoRow = styled(StakeInfoRow)`
  cursor: pointer;
  @media ${QUERIESV2.sm} {
    flex-direction: row;
    width: fit-content;
    gap: 12px;
    & > {
      width: fit-content;
    }
  }
`;

export const LightGrayItemText = styled.span<{ margin?: number }>`
  color: #e0f3ff;
  margin-right: ${({ margin }) => (margin ? `${margin}px` : 0)};
`;

export const StakeInfoItemSmall = styled(StakeInfoItem)`
  font-size: ${14 / 16}rem;

  @media ${QUERIESV2.sm} {
    font-size: ${12 / 16}rem;
  }
`;

interface IStyledProgressBar {
  className?: string;
}
export const StyledProgressBar = styled(ProgressBar)<IStyledProgressBar>`
  width: 80px;
  height: 14px;
  margin-top: 5px;
  padding-right: 4px;
  > div {
    height: 8px;
  }
`;

export const MutliplierValue = styled.div`
  font-weight: 400;
  gap: 12px;
  color: #e0f3ff;
  display: inline-flex;
  justify-content: flex-end;
  @media ${QUERIESV2.sm} {
    justify-content: flex-start;
  }
`;

export const APYInfo = styled(StakeInfo)`
  padding-bottom: 24px;
  @media ${QUERIESV2.sm} {
    flex-direction: row;
    justify-content: flex-start;
  }
  margin-bottom: 24px;
`;

export const APYInfoItem = styled(StakeInfoItem)`
  color: #c5d5e0;
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
`;
