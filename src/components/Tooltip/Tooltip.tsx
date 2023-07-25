/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { PlacesType } from "react-tooltip";
import {
  Wrapper,
  TitleRow,
  Body,
  GreyRoundedCheckmark16,
  TitleSecondary,
  StyledTooltip,
} from "./Tooltip.styles";
import { ReactComponent as RoundedCheckmark16 } from "assets/icons/rounded-checkmark-16.svg";
import { ReactComponent as RefereeIcon } from "assets/icons/referree.svg";
import { ReactComponent as ReferrerIcon } from "assets/icons/referrer.svg";
import { ReactComponent as SelfReferralIcon } from "assets/icons/self-referral.svg";
import { ReactComponent as ClockIcon } from "assets/icons/clock.svg";

export type TooltipIcon =
  | "green-checkmark"
  | "grey-checkmark"
  | "referee"
  | "referral"
  | "self-referral"
  | "clock";
export interface TooltipProps {
  tooltipId?: string;
  icon?: TooltipIcon;
  title?: string;
  titleSecondary?: string;
  body: string | JSX.Element;
  placement?: PlacesType;
}

export const Tooltip: React.FC<TooltipProps> = ({
  tooltipId,
  body,
  title,
  children,
  icon,
  placement,
  titleSecondary,
}) => {
  const id = tooltipId || title;

  if (!children) return null;

  return (
    <>
      <a data-tooltip-id={id} data-tooltip-place={placement}>
        {children}
      </a>
      <StyledTooltip id={id} noArrow>
        <Wrapper>
          {title && (
            <TitleRow>
              {icon === "green-checkmark" && <RoundedCheckmark16 />}
              {icon === "grey-checkmark" && <GreyRoundedCheckmark16 />}
              {icon === "self-referral" && <SelfReferralIcon />}
              {icon === "referral" && <ReferrerIcon />}
              {icon === "referee" && <RefereeIcon />}
              {icon === "clock" && <ClockIcon />}
              {title}
              {titleSecondary && (
                <TitleSecondary>{titleSecondary}</TitleSecondary>
              )}
            </TitleRow>
          )}
          <Body>{body}</Body>
        </Wrapper>
      </StyledTooltip>
    </>
  );
};
