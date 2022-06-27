import { StyledStepper } from "./Stepper.styles";

import useStepper from "./useStepper";
interface Props {
  numSteps: number;
}
const Stepper: React.FC<Props> = ({ numSteps }) => {
  const { stepItems } = useStepper(1, numSteps);

  return (
    <StyledStepper>
      {stepItems.map((el) => {
        return el;
      })}
    </StyledStepper>
  );
};

export default Stepper;
