import React, { useState } from "react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import {
  Wrapper,
  TitleRow,
  Body,
  GreyRoundedCheckmark16,
} from "./Tooltip.styles";
import { ReactComponent as RoundedCheckmark16 } from "assets/icons/rounded-checkmark-16.svg";
import { ReactComponent as RefereeIcon } from "assets/icons/referree.svg";
import { ReactComponent as ReferrerIcon } from "assets/icons/referrer.svg";
import { ReactComponent as SelfReferralIcon } from "assets/icons/self-referral.svg";

export type TooltipIcon =
  | "green-checkmark"
  | "grey-checkmark"
  | "referee"
  | "referral"
  | "self-referral";
export interface TooltipProps {
  icon?: TooltipIcon;
  title: string;
  body: string;
}

export const PopperTooltip: React.FC<{
  title: string;
  body: string;
  icon?: TooltipIcon;
  placement?: Placement;
}> = ({ body, title, children, icon, placement }) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const [hovered, setHovered] = useState(false);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement || "bottom",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 12] } },
      { name: "preventOverflow", options: { padding: 12 } },
      {
        name: "flip",
        options: { fallbackPlacements: [placement || "bottom"] },
      },
    ],
  });

  function onMouseEnter() {
    setHovered(true);
  }

  function onMouseLeave() {
    setHovered(false);
  }

  if (!children) return null;

  return (
    <>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child as any, {
          ref: setReferenceElement as any,
          onMouseEnter,
          onMouseLeave,
        });
      })}
      {hovered && (
        <div
          ref={setPopperElement}
          style={{ ...styles.popper, zIndex: 5 }}
          {...attributes.popper}
        >
          <Tooltip title={title} body={body} icon={icon} />
        </div>
      )}
    </>
  );
};

export const Tooltip: React.FC<TooltipProps> = ({ icon, title, body }) => {
  return (
    <Wrapper>
      <TitleRow>
        {icon === "green-checkmark" && <RoundedCheckmark16 />}
        {icon === "grey-checkmark" && <GreyRoundedCheckmark16 />}
        {icon === "self-referral" && <SelfReferralIcon />}
        {icon === "referral" && <ReferrerIcon />}
        {icon === "referee" && <RefereeIcon />}
        {title}
      </TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};
