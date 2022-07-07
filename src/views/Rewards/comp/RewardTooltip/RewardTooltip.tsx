import {
  Wrapper,
  TitleRow,
  Body,
  ToolTips,
  GreenCheckmark,
  Checkmark,
} from "./RewardTooltip.styles";
import { ReactComponent as User } from "assets/user-tooltip.svg";
import { ReactComponent as Users } from "assets/users-tooltip.svg";
import { ReactComponent as RightArrow } from "assets/corner-down-right-tooltip.svg";

import "./rewards.scss";

export interface TooltipProps {
  icon?: "user" | "users" | "green-checkmark" | "checkmark";
  title: string;
  body: string;
}

const ReferralTooltip: React.FC<TooltipProps> = ({ icon, title, body }) => {
  return (
    <Wrapper>
      <TitleRow>
        <ToolTips>
          {icon === "user" ? (
            <>
              <RightArrow /> <User />
            </>
          ) : icon === "users" ? (
            <Users />
          ) : icon === "green-checkmark" ? (
            <GreenCheckmark />
          ) : icon === "checkmark" ? (
            <Checkmark />
          ) : null}
        </ToolTips>
        {title}
      </TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default ReferralTooltip;
