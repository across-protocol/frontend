import { cloneElement } from "react";
import { Wrapper } from "./Stepper.styles";

import useStepperWithTooltips from "./useStepperWithTooltips";
interface Props {
  currentStep: number;
  numSteps: number;
}

const StepperWithTooltips: React.FC<Props> = ({ currentStep, numSteps }) => {
  const { stepItems } = useStepperWithTooltips(currentStep, numSteps);
  return (
    <Wrapper>
      {stepItems.map((el, i) => {
        return cloneElement(el, { key: i });
      })}
    </Wrapper>
  );
};

export default StepperWithTooltips;
