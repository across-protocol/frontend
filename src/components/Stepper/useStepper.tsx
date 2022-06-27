import { useState, useEffect, useCallback } from "react";
import { StyledStepperItem } from "./Stepper.styles";

export default function useStepper(numSteps: number) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    const items: JSX.Element[] = [];
    const midPoint = Math.round(numSteps / 2);
    console.log("midpoint", midPoint);
    for (let i = 0; i < numSteps; i++) {
      let className = "";
      const isNotStartOrFinalStep =
        (i + 1 > 1 && i + 1 !== numSteps) || (i + 1 < numSteps && i + 1 !== 1);

      if (isNotStartOrFinalStep) {
        if (i + 1 < midPoint) className = className.concat("before-middle");
        if (i + 1 > midPoint) className = className.concat("after-middle");
        if (i + 1 === midPoint) className = className.concat("middle");
      }
      if (i + 1 === 1) {
        className = className.concat("start");
      }
      if (i + 1 === numSteps) className = className.concat("end");

      const item = (
        <StyledStepperItem className={className} key={i}>
          <div className="step-counter">{i + 1}</div>
        </StyledStepperItem>
      );
      items.push(item);
    }
    setStepItems(items);
  }, [numSteps]);

  useEffect(() => {
    createStepsItems();
  }, [numSteps, createStepsItems]);

  return {
    stepItems,
  };
}
