import { useState, useCallback, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import {
  StepItem,
  Seperator,
  StepItemComplete,
  SeperatorComplete,
  NextStepItem,
} from "./Stepper.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { TooltipProps } from "views/Rewards/comp/RewardTooltip/RewardTooltip";
import RewardTooltip from "views/Rewards/comp/RewardTooltip";
export default function useStepperWithTooltips(
  currentStep: number,
  numSteps: number,
  tooltips: TooltipProps[],
  tooltipId: string
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
          <div
            data-html={true}
            data-tip={ReactDOMServer.renderToString(
              <RewardTooltip
                icon="green-checkmark"
                title={tooltips[i - 1].title}
                body={tooltips[i - 1].body}
              />
            )}
            data-for={tooltipId}
            data-place="right"
          >
            <StepItemComplete>
              <FontAwesomeIcon icon={faCheck} />
            </StepItemComplete>
            <SeperatorComplete />
          </div>
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
            <div
              data-html={true}
              data-tip={ReactDOMServer.renderToString(
                <RewardTooltip
                  title={tooltips[i - 1].title}
                  body={tooltips[i - 1].body}
                />
              )}
              data-for={tooltipId}
              data-place="right"
            >
              <StepItem>{i}</StepItem>
              <Seperator />
            </div>
          );
        }
      } else {
        if (i === numSteps) {
          item = (
            <div
              data-html={true}
              data-tip={ReactDOMServer.renderToString(
                <RewardTooltip
                  title={tooltips[i - 1].title}
                  body={tooltips[i - 1].body}
                />
              )}
              data-for={tooltipId}
              data-place="right"
            >
              <NextStepItem>{i}</NextStepItem>
            </div>
          );
        } else {
          item = (
            <div
              data-html={true}
              data-tip={ReactDOMServer.renderToString(
                <RewardTooltip
                  title={tooltips[i - 1].title}
                  body={tooltips[i - 1].body}
                />
              )}
              data-for={tooltipId}
              data-place="right"
            >
              {" "}
              <NextStepItem>{i}</NextStepItem>
              <Seperator />
            </div>
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
