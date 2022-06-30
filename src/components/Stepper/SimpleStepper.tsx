import {
  Wrapper,
  StepItem,
  Seperator,
  StepItemComplete,
  SeperatorComplete,
  NextStepItem,
} from "./SimpleStepper.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface Props {
  currentStep: number;
  numSteps: number;
}

const SimpleStepper: React.FC<Props> = () => {
  return (
    <Wrapper>
      <StepItemComplete>
        <FontAwesomeIcon icon={faCheck} />
      </StepItemComplete>
      <SeperatorComplete />
      <StepItem>2</StepItem>
      <Seperator />
      <NextStepItem>3</NextStepItem>
      <Seperator />
      <NextStepItem>4</NextStepItem>
      <Seperator />
      <NextStepItem>5</NextStepItem>
    </Wrapper>
  );
};

export default SimpleStepper;
