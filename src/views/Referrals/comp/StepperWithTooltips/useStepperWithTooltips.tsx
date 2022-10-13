import React, { useState, useCallback, useEffect, forwardRef } from "react";
import {
  StepItem,
  Seperator,
  StepItemComplete,
  SeperatorComplete,
  StepItemNext,
} from "./StepperWithTooltips.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { PopperTooltip, TooltipProps } from "components/Tooltip/Tooltip";

export const StepFactory = forwardRef<
  HTMLInputElement,
  {
    type: "completed" | "current" | "next";
    children: React.ReactNode;
  }
>((props, ref) => {
  const { type, ...rest } = props;
  const newProps = { ...rest, ref };
  if (type === "completed") {
    return <StepItemComplete {...newProps} />;
  }
  if (type === "next") {
    return <StepItemNext {...newProps} />;
  }
  return <StepItem {...newProps} />;
});

export const StepItemComponent: React.FC<{
  title: string;
  titleSecondary?: string;
  body: string;
  type: "completed" | "current" | "next";
}> = ({ body, title, children, type, titleSecondary }) => {
  return (
    <PopperTooltip
      title={title}
      titleSecondary={titleSecondary}
      body={body}
      icon={
        type === "current" || type === "completed"
          ? "green-checkmark"
          : "grey-checkmark"
      }
    >
      <StepFactory type={type}>{children}</StepFactory>
    </PopperTooltip>
  );
};

export default function useStepperWithTooltips(
  currentStep: number,
  numSteps: number,
  tooltips: TooltipProps[]
) {
  const [stepItems, setStepItems] = useState<JSX.Element[]>([]);
  const createStepsItems = useCallback(() => {
    let items: JSX.Element[] = [];
    for (let i = 0; i < numSteps; i++) {
      const completed = i < currentStep;
      const current = i === currentStep;

      if (completed) {
        if (i > 0) {
          items.push(<SeperatorComplete />);
        }
        items.push(
          <StepItemComponent
            key={i}
            title={tooltips[i].title}
            titleSecondary={tooltips[i].titleSecondary}
            body={tooltips[i].body}
            type="completed"
          >
            <FontAwesomeIcon icon={faCheck} />
          </StepItemComponent>
        );
      } else if (current) {
        if (i > 0) {
          items.push(<SeperatorComplete />);
        }
        items.push(
          <StepItemComponent
            key={i}
            title={tooltips[i].title}
            titleSecondary={tooltips[i].titleSecondary}
            body={tooltips[i].body}
            type="current"
          >
            {i + 1}
          </StepItemComponent>
        );
      } else {
        if (i > 0) {
          items.push(<Seperator />);
        }
        items.push(
          <StepItemComponent
            key={i}
            title={tooltips[i].title}
            titleSecondary={tooltips[i].titleSecondary}
            body={tooltips[i].body}
            type="next"
          >
            {i + 1}
          </StepItemComponent>
        );
      }
    }

    setStepItems(items);
  }, [numSteps, currentStep, tooltips]);

  useEffect(() => {
    createStepsItems();
  }, [numSteps, createStepsItems]);

  return {
    stepItems,
  };
}
