import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as CheckMark } from "assets/icons/filled-checkmark-16.svg";
import { ReactComponent as InvalidMark } from "assets/icons/solid-times-16.svg";

export type CheckIconState = "eligible" | "ineligible" | "undetermined";

type CardIconProps = {
  Icon: React.FunctionComponent;
  checkIconState?: CheckIconState;
};

const CardIcon = ({ Icon, checkIconState }: CardIconProps) => {
  const resolvedIconState = checkIconState ?? "undetermined";
  const CheckIcon = CheckIconMapping[resolvedIconState].CheckIcon;
  const isCheckIconPresent = Boolean(checkIconState);
  return (
    <Wrapper addPadding={isCheckIconPresent}>
      <IconWrapper state={resolvedIconState}>
        <Icon />
      </IconWrapper>
      {isCheckIconPresent && <CheckIcon />}
    </Wrapper>
  );
};

export default React.memo(CardIcon);

type WrapperType = {
  addPadding: boolean;
};
const Wrapper = styled.div<WrapperType>`
  height: 64px;
  width: 64px;

  position: relative;

  padding-right: ${({ addPadding }) => (addPadding ? "2px" : "0")};
  padding-bottom: ${({ addPadding }) => (addPadding ? "2px" : "0")};

  isolation: isolate;
`;

type IconWrapperType = { state: CheckIconState };
const IconWrapper = styled.div<IconWrapperType>`
  height: 100%;
  width: 100%;

  padding: 3px;
  background-color: #2d2e33;

  border: 1px solid ${({ state }) => CheckIconMapping[state].color};
  border-radius: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: clip;
`;

const UndeterminedStyledCheckMark = styled(CheckMark)`
  position: absolute;
  bottom: -1px;
  right: -1px;

  height: 25px;
  width: 25px;

  background-color: #2d2e33;
  border: 1px solid #2d2e33;
  border-radius: 42px;
`;

const EligibleStyledCheckMark = styled(UndeterminedStyledCheckMark)`
  & rect:first-of-type {
    fill: #6cf9d8;
  }
`;

const IneligibleStyledCheckMark = styled(InvalidMark)`
  position: absolute;
  bottom: -1px;
  right: -1px;

  height: 25px;
  width: 25px;

  background-color: #2d2e33;
  border: 1px solid #2d2e33;
  border-radius: 42px;
`;

export const CheckIconMapping: Record<
  CheckIconState,
  { color: string; CheckIcon: React.FunctionComponent }
> = {
  eligible: { color: "#6cf9d8", CheckIcon: EligibleStyledCheckMark },
  ineligible: { color: "#F96c6c", CheckIcon: IneligibleStyledCheckMark },
  undetermined: { color: "#4c4e57", CheckIcon: UndeterminedStyledCheckMark },
};
