import { useState, useCallback, useEffect } from "react";
import {
  StepItem,
  Seperator,
  StepItemComplete,
  SeperatorComplete,
  NextStepItem,
} from "./SimpleStepper.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function useSimpleStepper(
  currentStep: number,
  numSteps: number
) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    const items: JSX.Element[] = [];
    for (let i = 1; i <= numSteps; i++) {
      const completed = i < currentStep;
      const current = i === currentStep;
      let item: JSX.Element;
      if (completed) {
        item = (
          <>
            <StepItemComplete>
              <FontAwesomeIcon icon={faCheck} />
            </StepItemComplete>
            <SeperatorComplete />
          </>
        );
      } else if (current) {
        if (currentStep === numSteps) {
          item = (
            <>
              <StepItem>{i}</StepItem>
            </>
          );
        } else {
          item = (
            <>
              <StepItem>{i}</StepItem>
              <Seperator />
            </>
          );
        }
      } else {
        if (i === numSteps) {
          item = (
            <>
              <NextStepItem>{i}</NextStepItem>
            </>
          );
        } else {
          item = (
            <>
              <NextStepItem>{i}</NextStepItem>
              <Seperator />
            </>
          );
        }
      }

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
