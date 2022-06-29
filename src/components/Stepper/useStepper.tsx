import { useState, useEffect, useCallback } from "react";
import { StyledStepperItem } from "./Stepper.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

/* 
  useStepper is largely for handling the classes need to properly show the lines between number elements.
  It's rather complicated because of how the stepper needs to lay itself out on the page, and the space between these elements.
*/
export default function useStepper(currentStep: number, numSteps: number) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    const items: JSX.Element[] = [];
    const midPoint = Math.round(numSteps / 2);
    for (let i = 1; i <= numSteps; i++) {
      const completed = i < currentStep;
      let className = completed
        ? "completed"
        : i === currentStep
        ? ""
        : "next-step";
      const isNotStartOrFinalStep =
        (i > 1 && i !== numSteps) || (i < numSteps && i !== 1);

      if (isNotStartOrFinalStep) {
        if (i < midPoint) className = className.concat(" before-middle");
        if (i > midPoint) className = className.concat(" after-middle");
        if (i === midPoint) className = className.concat(" middle");
      }
      if (i === 1) {
        className = className.concat(" start");
      }
      if (i === numSteps) className = className.concat(" end");

      const item = (
        <StyledStepperItem className={className} key={i}>
          {!completed ? (
            <div className="step-counter">{i}</div>
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
