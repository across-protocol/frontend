import React, { ReactNode } from "react";
import { PlacesType } from "react-tooltip";
import {
  Body,
  GreyRoundedCheckmark16,
  StyledAnchor,
  StyledTooltip,
  TitleRow,
  TitleSecondary,
  Wrapper,
} from "./Tooltip.styles";
import { ReactComponent as RoundedCheckmark16 } from "assets/icons/checkmark-circle.svg";
import { ReactComponent as RefereeIcon } from "assets/icons/referree.svg";
import { ReactComponent as ReferrerIcon } from "assets/icons/referrer.svg";
import { ReactComponent as SelfReferralIcon } from "assets/icons/self-referral.svg";
import { ReactComponent as ClockIcon } from "assets/icons/clock.svg";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";

const iconMap = {
  "green-checkmark": <RoundedCheckmark16 />,
  "grey-checkmark": <GreyRoundedCheckmark16 />,
  "self-referral": <SelfReferralIcon />,
  referral: <ReferrerIcon />,
  referee: <RefereeIcon />,
  clock: <ClockIcon />,
  info: <InfoIcon />,
};

export type TooltipIcon = keyof typeof iconMap;

export interface TooltipProps {
  tooltipId?: string;
  icon?: TooltipIcon | ReactNode;
  title?: string;
  titleSecondary?: string;
  body: string | JSX.Element;
  placement?: PlacesType;
  maxWidth?: number;
  offset?: number;
  anchorWidth?: string;
  children?: ReactNode;
  paddingPx?: number;
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
  anchorWidth,
  paddingPx = 16,
}) => {
  const id = tooltipId || title;

  if (!children) return null;

  const iconElement = iconMap[icon as TooltipIcon] || icon;

  return (
    <>
      <StyledAnchor
        data-tooltip-id={id}
        data-tooltip-place={placement}
        width={anchorWidth}
      >
        {children}
      </StyledAnchor>
      <StyledTooltip id={id} noArrow opacity={1} offset={offset}>
        <Wrapper maxWidth={maxWidth} paddingPx={paddingPx}>
          {title && (
            <TitleRow>
              {iconElement}
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
