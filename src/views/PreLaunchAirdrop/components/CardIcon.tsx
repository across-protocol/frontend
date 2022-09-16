import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as CheckMark } from "assets/icons/filled-checkmark-16.svg";
import { ReactComponent as InvalidMark } from "assets/icons/solid-times-16.svg";
import { QUERIES } from "utils";

export type CheckIconState = "eligible" | "ineligible" | "undetermined";

type CardIconProps = {
  Icon: React.FunctionComponent;
  checkIconState?: CheckIconState;
};

const CardIcon = ({ Icon, checkIconState }: CardIconProps) => {
  const resolvedIconState = checkIconState ?? "undetermined";
  const CheckIcon = CheckIconMapping[resolvedIconState].CheckIcon;
  const isCheckIconPresent = Boolean(checkIconState);
  return isCheckIconPresent ? (
    <Wrapper>
      <IconWrapper addPadding={isCheckIconPresent} state={resolvedIconState}>
        <Icon />
      </IconWrapper>
      {isCheckIconPresent && <CheckIcon />}
    </Wrapper>
  ) : (
    <BaseWrapper>
      <Icon />
    </BaseWrapper>
  );
};

export default CardIcon;

const BaseWrapper = styled.div`
  & svg {
    height: 56px;
    width: 56px;
  }
`;

const Wrapper = styled.div`
  position: relative;
  isolation: isolate;

  height: 64px;
  width: 64px;

  @media ${QUERIES.tabletAndDown} {
    height: 54px;
    width: 54px;
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

  height: ${({ addPadding }) => (addPadding ? "calc(100% - 2px)" : "100%")};
  width: ${({ addPadding }) => (addPadding ? "calc(100% - 2px)" : "100%")};
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
