import { Wrapper } from "./SimpleStepper.styles";

import useSimpleStepper from "./useSimpleStepper";
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
