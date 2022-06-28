import { StyledStepper } from "./Stepper.styles";

import useStepper from "./useStepper";
interface Props {
  currentStep: number;
  numSteps: number;
}
const Stepper: React.FC<Props> = ({ currentStep, numSteps }) => {
  const { stepItems } = useStepper(currentStep, numSteps);

  return (
    <StyledStepper>
      {stepItems.map((el) => {
        return el;
      })}
    </StyledStepper>
  );
};

export default Stepper;
