import { useState, useEffect, useCallback } from "react";
import { StyledStepperItem } from "./Stepper.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

/*
  note: Index currentStep to -1 (IE: 1 is 0, 2 is 1...)
*/

export default function useStepper(currentStep: number, numSteps: number) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    const items: JSX.Element[] = [];
    const midPoint = Math.round(numSteps / 2);
    for (let i = 0; i < numSteps; i++) {
      const completed = i + 1 <= currentStep;
      let className = completed ? "completed" : "";
      const isNotStartOrFinalStep =
        (i + 1 > 1 && i + 1 !== numSteps) || (i + 1 < numSteps && i + 1 !== 1);

      if (isNotStartOrFinalStep) {
        if (i + 1 < midPoint) className = className.concat(" before-middle");
        if (i + 1 > midPoint) className = className.concat(" after-middle");
        if (i + 1 === midPoint) className = className.concat(" middle");
      }
      if (i + 1 === 1) {
        className = className.concat(" start");
      }
      if (i + 1 === numSteps) className = className.concat(" end");

      const item = (
        <StyledStepperItem className={className} key={i}>
          {!completed ? (
            <div className="step-counter">{i + 1}</div>
          ) : (
            <div className="step-counter checkmark">
              <FontAwesomeIcon icon={faCheck} />
            </div>
          )}
        </StyledStepperItem>
      );
      items.push(item);
    }
    setStepItems(items);
  }, [numSteps, currentStep]);

  useEffect(() => {
    createStepsItems();
  }, [numSteps, createStepsItems]);

  return {
    stepItems,
  };
}
