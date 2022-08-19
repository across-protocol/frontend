import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import ProgressBar from "components/ProgressBar";
import { ReactComponent as UnstyedUsdcLogo } from "assets/icons/usdc-green-16.svg";
import { ReactComponent as UnstyledArrowIcon } from "assets/icons/arrow-16.svg";
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

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  width: calc(100% - 48px);
  margin: 0 auto 24px;
  justify-items: center;
`;

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
  padding: 24px 0 20px;
  border-bottom: ${(props) =>
    props.active ? "2px solid #e0f3ff" : "1px solid #3E4047"};
  cursor: pointer;
`;

export const InputRow = styled.div`
  display: flex;
  width: calc(100% - 48px);
  margin: 0 auto;
  gap: 16px;
  border-bottom: 1px solid #3e4047;
  padding-bottom: 24px;
  flex-direction: row;
  @media ${QUERIESV2.sm} {
    flex-direction: column;
  }
`;

export const UsdcLogo = styled(UnstyedUsdcLogo)`
  position: absolute;
  left: 24px;
  top: 20px;
`;

export const InputWrapper = styled.div`
  flex-grow: 8;
  position: relative;
`;

export const Input = styled.input`
  height: 64px;
  padding: 9px 64px;
  width: 100%;
  background: #2d2e33;
  border: 1px solid #4c4e57;
  border-radius: 32px;
  color: #e0f3ff;
`;

export const MaxButton = styled(UnstyledButton)`
  height: 24px;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c5d5e0;
  position: absolute;
  right: 24px;
  top: 20px;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border: 1px solid #4c4e57;
  border-radius: 24px;
  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }
`;

export const ButtonWrapper = styled.div`
  flex-grow: 1;
`;

interface IStakeButton {
  valid: boolean;
}
export const StakeButton = styled(UnstyledButton)<IStakeButton>`
  background: #6cf9d8;
  padding: 0px 40px;
  height: 64px;
  color: #2d2e33;
  opacity: ${({ valid }) => (valid ? 1 : 0.25)};
  @media ${QUERIESV2.sm} {
    text-align: center;
    width: 100%;
    height: 40px;
    padding: 0px 20px;
    border-radius: 20px;
  }
`;

export const StakeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: 16px;
  flex-wrap: wrap;
  width: calc(100% - 48px);
  border-bottom: 1px solid #3e4047;

  @media (max-width: 568px) {
    flex-direction: column;
  }

  @media (max-width: 428px) {
    padding: 4px 0 0;
  }
`;

export const StakeInfoItem = styled.div`
  display: flex;
  align-items: center;
  padding-top: 12px;
  width: 40%;
  color: #9daab2;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;

  &:nth-of-type(2n) {
    width: 60%;
    justify-content: flex-end;
    color: #e0f3ff;
  }

  @media (max-width: 568px) {
    width: 100% !important;

    &:nth-of-type(2n) {
      flex-direction: row-reverse;
      padding-top: 4px;
    }

    &:nth-of-type(2n + 1) {
      padding-top: 16px;
    }
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const LightGrayItemText = styled.span<{ margin?: number }>`
  color: #9daab2;
  margin: ${({ margin }) => (margin ? `0 ${margin}px` : 0)};
`;

export const StakeInfoItemSmall = styled(StakeInfoItem)`
  font-size: ${14 / 16}rem;
  width: 80%;
`;

interface IStyledProgressBar {
  className?: string;
}
export const StyledProgressBar = styled(ProgressBar)<IStyledProgressBar>`
  max-width: 60px;
  margin-right: 7px;
  height: 14px;
  margin-top: 5px;
  > div {
    height: 8px;
  }
`;

export const MutliplierValue = styled.div`
  font-weight: 400;
  font-size: 1rem;
  color: #e0f3ff;
  display: inline-flex;
  flex-grow: 2;
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
`;

export const APYInfoItem = styled(StakeInfoItem)`
  padding-top: 0;
  color: #c5d5e0;
  @media ${QUERIESV2.sm} {
    &:nth-of-type(2n) {
      padding-top: 0;
    }
    &:nth-of-type(2n + 1) {
      padding-top: 0;
    }
    width: 40% !important;
  }
`;

export const ArrowIcon = styled(UnstyledArrowIcon)`
  margin-right: 11px;
  cursor: pointer;
  path {
    stroke: #9daab2;
  }
`;
