import { Wrapper } from "./Stepper.styles";

import useSimpleStepper from "./useStepper";
interface Props {
  currentStep: number;
  numSteps: number;
}

const SimpleStepper: React.FC<Props> = ({ currentStep, numSteps }) => {
  const { stepItems } = useSimpleStepper(currentStep, numSteps);
  return (
    <Wrapper>
      {stepItems.map((el) => {
        return el;
      })}
    </Wrapper>
  );
};

export default SimpleStepper;
