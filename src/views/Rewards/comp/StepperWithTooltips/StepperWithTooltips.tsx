import { cloneElement } from "react";
import ReactTooltip from "react-tooltip";
import useStepperWithTooltips from "./useStepperWithTooltips";
import { Wrapper } from "./StepperWithTooltips.styles";

import { TooltipProps } from "../RewardTooltip/RewardTooltip";
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
      <ReactTooltip id={tooltipId} />
    </Wrapper>
  );
};

export default StepperWithTooltips;
