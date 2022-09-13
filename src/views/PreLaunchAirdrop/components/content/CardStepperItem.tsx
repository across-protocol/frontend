import React from "react";
import { Progress } from "./CardStepper";
import { ReactComponent as CheckMark } from "assets/icons/filled-checkmark-16.svg";
import { ReactComponent as InvalidMark } from "assets/icons/solid-times-16.svg";
import styled from "@emotion/styled";

type ProgressWithAfterState = Progress | "not_reached";

type CardStepperItemParams = {
  buttonContent: React.ReactElement;
  buttonHandler: () => void;

  title: string;
  Icon?: React.FC;
  subHeader?: string;

  progress: Progress;
  afterCurrent: boolean;
  previousProgress?: Progress;
};

const CardStepperItem = ({ progress, afterCurrent }: CardStepperItemParams) => {
  const modifiedProgress = afterCurrent ? "not_reached" : progress;

  return ProgressMapping[modifiedProgress].Icon;
};

export default CardStepperItem;

type ProgressStyleParam = {
  progress: ProgressWithAfterState;
};

const StyledFailureIcon = styled(InvalidMark)`
  padding: 2px;
  border-color: ${() => ProgressMapping["failed"].color};
  border-width: 1px;
  border-style: solid;
  border-radius: 50%;
  background-color: "#2d2e33";
`;
const StyledCheckIcon = styled(CheckMark)<ProgressStyleParam>`
  padding: 0px;
  border-color: ${({ progress }) => ProgressMapping[progress].color};
  border-width: 1px;
  border-style: solid;
  border-radius: 50%;

  height: calc(24px + 4px + 1px);
  width: calc(24px + 4px + 1px);

  & rect:first-of-type {
    fill: ${({ progress }) => ProgressMapping[progress].color};
  }

  background-color: "#2d2e33";
`;

const ProgressMapping: Record<
  ProgressWithAfterState,
  { color: string; Icon: React.ReactElement }
> = {
  awaiting: {
    color: "#E0F3FF",
    Icon: <StyledCheckIcon progress={"awaiting"} />,
  },
  not_reached: {
    color: "#4C4E57",
    Icon: <StyledCheckIcon progress={"not_reached"} />,
  },
  completed: {
    color: "#6CF9D8",
    Icon: <StyledCheckIcon progress={"completed"} />,
  },
  failed: {
    color: "#F96C6C",
    Icon: <StyledFailureIcon />,
  },
};
