import React from "react";
import { Progress } from "./CardStepper";
import { ReactComponent as CheckMark } from "assets/icons/filled-checkmark-16.svg";
import { ReactComponent as InvalidMark } from "assets/icons/solid-times-16.svg";
import styled from "@emotion/styled";
import { ButtonV2 } from "components";

type ProgressWithAfterState = Progress | "not_reached";

type CardStepperItemParams = {
  buttonContent: React.ReactElement | string;
  buttonHandler: () => void;
  disableButton?: boolean;

  title: string;
  Icon?: React.ReactElement;
  subHeader: string;

  progress: Progress;
  afterCurrent: boolean;
  previousProgress?: ProgressWithAfterState;
};

const CardStepperItem = ({
  progress,
  afterCurrent,
  buttonHandler,
  buttonContent,
  subHeader,
  title,
  previousProgress,
  Icon: StepIcon,
  disableButton,
}: CardStepperItemParams) => {
  const modifiedProgress = afterCurrent ? "not_reached" : progress;
  const isResolvedStep =
    modifiedProgress === "completed" || modifiedProgress === "failed";
  const Icon = ProgressMapping[modifiedProgress].Icon;
  const useAltButton = isResolvedStep;
  const useHiddenButton = modifiedProgress === "not_reached";

  return (
    <StepItemWrapper>
      <ProgressIconTextWrapper>
        <IconWrapper>
          {previousProgress && (
            <IconLinkConnection
              progress={modifiedProgress}
              previous={previousProgress}
            />
          )}
          {Icon}
        </IconWrapper>
        <StepIconTextWrapper>
          {StepIcon && isResolvedStep && (
            <CustomIconContainer progress={modifiedProgress}>
              {StepIcon}
            </CustomIconContainer>
          )}
          <TextWrapper>
            <TextSubHeader progress={modifiedProgress}>
              {subHeader}
            </TextSubHeader>
            <TextHeader progress={modifiedProgress}>{title}</TextHeader>
          </TextWrapper>
        </StepIconTextWrapper>
      </ProgressIconTextWrapper>
      <StyledButton
        alternativeStyle={useAltButton}
        hidden={useHiddenButton}
        size="lg"
        onClick={buttonHandler}
        disabled={disableButton || useHiddenButton}
      >
        {buttonContent}
      </StyledButton>
    </StepItemWrapper>
  );
};

export default CardStepperItem;

type ProgressStyleParam = {
  progress: ProgressWithAfterState;
};

type ProgressStyleAndPrevParam = ProgressStyleParam & {
  previous: ProgressWithAfterState;
};

const StepItemWrapper = styled.div`
  display: flex;
  flex-direction: row;

  justify-content: space-between;
  align-items: center;
`;

const IconWrapper = styled.div`
  position: relative;
  // Need to discuss with Tim about precise breakpoints
  @media screen and (max-width: 624px) {
    display: none;
  }
`;

const StepIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;

  justify-content: center;
  align-items: flex-start;
`;

const CustomIconContainer = styled.div<ProgressStyleParam>`
  padding: 2px;
  border-radius: 50%;
  border: solid 1px ${({ progress }) => ProgressMapping[progress].color};

  height: 46px;
  width: 46px;

  & img {
    height: 40px;
    width: 40px;
  }
  & svg {
    height: 40px;
    width: 40px;
  }
`;

const IconLinkConnection = styled.div<ProgressStyleAndPrevParam>`
  position: absolute;
  left: calc(50% - 1px);
  top: calc(-24px - 2px);
  border-radius: 10px;

  height: 24px;
  width: 1px;
  background: linear-gradient(to bottom, transparent 50%, #34353b 50%),
    linear-gradient(
      to bottom,
      ${({ progress, previous }) =>
        `${ProgressMapping[previous].color}, ${ProgressMapping[progress].color}`}
    );
  background-size: 24px 8px, 24px 100%;
`;

const ProgressIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 42px;
  justify-content: center;
  align-items: center;
`;

const TextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  justify-content: space-between;

  width: 100%;
`;

const TextSubHeader = styled.p<ProgressStyleParam>`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;

  color: ${({ progress }) =>
    progress === "completed" || progress === "failed"
      ? ProgressMapping[progress].color
      : "#9daab2"};
`;

const TextHeader = styled.p<ProgressStyleParam>`
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: ${({ progress }) =>
    progress === "not_reached" ? "#9daab2" : "#e0f3ff"};
`;

const StyledFailureIcon = styled(InvalidMark)`
  padding: 0px;
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

  flex-shrink: 0;
`;

type StyleButtonProp = {
  alternativeStyle: boolean;
  hidden: boolean;
};

const StyledButton = styled(ButtonV2)<StyleButtonProp>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  gap: 6px;
  padding: 0px 20px;

  height: 40px;

  border-radius: 20px;

  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  display: flex;
  align-items: center;

  color: ${({ alternativeStyle }) =>
    alternativeStyle ? "#e0f3ff" : "#2d2e33"};
  background: ${({ alternativeStyle }) =>
    alternativeStyle ? "#34353b" : "#6cf9d8"};
  border: 1px solid
    ${({ alternativeStyle }) => (alternativeStyle ? "#4C4E57" : "#6cf9d8")};
  border-radius: 20px;
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
