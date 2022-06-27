import { useState, useEffect, useCallback } from "react";
import { StyledStepperItem } from "./Stepper.styles";

export default function useStepper(numSteps: number) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    const items: JSX.Element[] = [];
    for (let i = 0; i < numSteps; i++) {
      const item = (
        <StyledStepperItem key={i}>
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
