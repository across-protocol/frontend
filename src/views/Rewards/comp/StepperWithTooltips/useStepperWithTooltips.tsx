import { useState, useCallback, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import {
  StepItem,
  Seperator,
  StepItemComplete,
  SeperatorComplete,
  NextStepItem,
  TooltipWrapper,
} from "./StepperWithTooltips.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { TooltipProps } from "views/Rewards/comp/RewardTooltip/RewardTooltip";
import RewardTooltip from "views/Rewards/comp/RewardTooltip";
import ReactTooltip from "react-tooltip";

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
          <>
            <StepItemComplete
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
              <FontAwesomeIcon icon={faCheck} />
            </StepItemComplete>
            <SeperatorComplete />
          </>
        );
      } else if (current) {
        if (currentStep === numSteps) {
          item = (
            <TooltipWrapper>
              <StepItem>{i}</StepItem>
            </TooltipWrapper>
          );
        } else {
          item = (
            <>
              <StepItem
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
                {i}
              </StepItem>
              <Seperator />
            </>
          );
        }
      } else {
        if (i === numSteps) {
          item = (
            <>
              <NextStepItem
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
                {i}
              </NextStepItem>
            </>
          );
        } else {
          item = (
            <>
              <NextStepItem
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
                {i}
              </NextStepItem>
              <Seperator />
            </>
          );
        }
      }

      items.push(item);
    }
    setStepItems(items);
  }, [numSteps, currentStep, tooltipId, tooltips]);

  useEffect(() => {
    createStepsItems();
  }, [numSteps, createStepsItems]);

  useEffect(() => {
    ReactTooltip.rebuild();
  });

  return {
    stepItems,
  };
}
