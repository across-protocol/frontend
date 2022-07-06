import { cloneElement } from "react";
import { Wrapper } from "./Stepper.styles";

import useSimpleStepper from "./useStepper";
interface Props {
  currentStep: number;
  numSteps: number;
}

const Stepper: React.FC<Props> = ({ currentStep, numSteps }) => {
  const { stepItems } = useSimpleStepper(currentStep, numSteps);
  return (
    <Wrapper>
      {stepItems.map((el, i) => {
        return cloneElement(el, { key: i });
      })}
    </Wrapper>
  );
};

export default Stepper;
