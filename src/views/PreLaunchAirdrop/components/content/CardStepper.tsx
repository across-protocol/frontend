import styled from "@emotion/styled";
import CardStepperItem from "./CardStepperItem";

export type Progress = "completed" | "awaiting" | "failed";

type CardStepperParams = {
  steps: {
    buttonContent: React.ReactElement;
    buttonHandler: () => void;

    stepTitle: string;
    stepIcon?: React.FC;
    completedText?: string;

    stepProgress: Progress;
  }[];
};

const CardStepper = ({ steps }: CardStepperParams) => {
  let pastCurrentStep = false;
  let failureEncountered = false;
  let previousState: Progress | undefined = undefined;
  const stepElements = steps.map((step, stepNo) => {
    const isStepAwaiting = step.stepProgress === "awaiting";
    const isStepFailure = step.stepProgress === "failed";
    const isStepSuccess = step.stepProgress === "completed";

    const subHeader =
      isStepAwaiting || !step.completedText
        ? `Step ${stepNo + 1}`
        : step.completedText;

    const stepItem = (
      <CardStepperItem
        key={stepNo}
        subHeader={subHeader}
        buttonContent={step.buttonContent}
        buttonHandler={step.buttonHandler}
        title={step.stepTitle}
        progress={step.stepProgress}
        afterCurrent={pastCurrentStep}
        previousProgress={previousState}
      />
    );

    // Enable the failed encounter if this step is a failure
    failureEncountered = failureEncountered || isStepFailure;
    // Determine the most recent
    pastCurrentStep = pastCurrentStep || !isStepSuccess;
    previousState = step.stepProgress;
    return stepItem;
  });

  return <StepperWrapper>{stepElements}</StepperWrapper>;
};

export default CardStepper;

const StepperWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
