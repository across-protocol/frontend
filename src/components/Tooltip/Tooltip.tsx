/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ReactNode } from "react";
import { PlacesType } from "react-tooltip";
import {
  Wrapper,
  TitleRow,
  Body,
  GreyRoundedCheckmark16,
  TitleSecondary,
  StyledTooltip,
  StyledAnchor,
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
  icon?: TooltipIcon | ReactNode;
  title?: string;
  titleSecondary?: string;
  body: string | JSX.Element;
  placement?: PlacesType;
  maxWidth?: number;
  offset?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  tooltipId,
  body,
  title,
  children,
  icon,
  placement,
  titleSecondary,
  maxWidth,
  offset,
}) => {
  const id = tooltipId || title;

  if (!children) return null;

  return (
    <>
      <StyledAnchor data-tooltip-id={id} data-tooltip-place={placement}>
        {children}
      </StyledAnchor>
      <StyledTooltip id={id} noArrow opacity={1} offset={offset}>
        <Wrapper maxWidth={maxWidth}>
          {title && (
            <TitleRow>
              {typeof icon === "object" && icon}
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
