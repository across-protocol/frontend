import { cloneElement } from "react";
import { Wrapper } from "./Stepper.styles";

import useStepperWithTooltips from "./useStepperWithTooltips";
import { TooltipProps } from "views/Rewards/comp/RewardTooltip/RewardTooltip";
interface Props {
  currentStep: number;
  numSteps: number;
  tooltips: TooltipProps[];
  tooltipId: string;
}

const StepperWithTooltips: React.FC<Props> = ({
  currentStep,
  numSteps,
  tooltips,
  tooltipId,
}) => {
  const { stepItems } = useStepperWithTooltips(
    currentStep,
    numSteps,
    tooltips,
    tooltipId
  );
  return (
    <Wrapper>
      {stepItems.map((el, i) => {
        return cloneElement(el, { key: i });
      })}
    </Wrapper>
  );
};

export default StepperWithTooltips;
