import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as CheckMark } from "assets/icons/filled-checkmark-16.svg";
import { ReactComponent as InvalidMark } from "assets/icons/solid-times-16.svg";
import { QUERIESV2 } from "utils";

export type CheckIconState = "eligible" | "ineligible" | "undetermined";

type Props = {
  Icon: React.ReactElement;
  checkIconState?: CheckIconState;
};

const IconWithCheck = ({ Icon, checkIconState }: Props) => {
  const resolvedIconState = checkIconState ?? "undetermined";
  const CheckIcon = CheckIconMapping[resolvedIconState].CheckIcon;
  const isCheckIconPresent = Boolean(checkIconState);
  return (
    <Wrapper>
      <IconWrapper addPadding={isCheckIconPresent} state={resolvedIconState}>
        {Icon}
      </IconWrapper>
      {isCheckIconPresent && <CheckIcon />}
    </Wrapper>
  );
};

export default IconWithCheck;

const Wrapper = styled.div`
  position: relative;
  isolation: isolate;

  height: 38px;
  width: 38px;

  @media ${QUERIESV2.tb.andDown} {
    height: 30px;
    width: 30px;
  }
`;

type IconWrapperType = { state: CheckIconState; addPadding: boolean };
const IconWrapper = styled.div<IconWrapperType>`
  padding: 3px;
  background-color: #2d2e33;

  border: 1px solid ${({ state }) => CheckIconMapping[state].color};
  border-radius: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: clip;

  height: ${({ addPadding }) => (addPadding ? "calc(100% - 1px)" : "100%")};
  width: ${({ addPadding }) => (addPadding ? "calc(100% - 1px)" : "100%")};

  svg {
    height: 32px;
    width: 32px;
  }
`;

const UndeterminedStyledCheckMark = styled(CheckMark)`
  position: absolute;
  bottom: -1px;
  right: -1px;

  height: 18px;
  width: 18px;

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

  height: 18px;
  width: 18px;

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
