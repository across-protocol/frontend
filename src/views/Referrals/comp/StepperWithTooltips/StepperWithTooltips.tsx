import { cloneElement } from "react";
import useStepperWithTooltips from "./useStepperWithTooltips";
import { Wrapper } from "./StepperWithTooltips.styles";

import { TooltipProps } from "../../../../components/Tooltip/Tooltip";
interface Props {
  currentStep: number;
  numSteps: number;
  tooltips: TooltipProps[];
}

const StepperWithTooltips: React.FC<Props> = ({
  currentStep,
  numSteps,
  tooltips,
}) => {
  const { stepItems } = useStepperWithTooltips(currentStep, numSteps, tooltips);
  return (
    <Wrapper>
      {stepItems.map((el, i) => {
        return cloneElement(el, { key: i });
      })}
    </Wrapper>
  );
};

export default StepperWithTooltips;
