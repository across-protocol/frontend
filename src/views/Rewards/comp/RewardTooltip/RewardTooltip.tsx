import { Wrapper, TitleRow, Body, ToolTips } from "./RewardTooltip.styles";
import { ReactComponent as User } from "assets/user-tooltip.svg";
import { ReactComponent as Users } from "assets/users-tooltip.svg";
import { ReactComponent as RightArrow } from "assets/corner-down-right-tooltip.svg";

import "./rewards.scss";

interface Props {
  icon: "user" | "users";
  title: string;
  body: string;
}

const ReferralTooltip: React.FC<Props> = ({ icon, title, body }) => {
  return (
    <Wrapper>
      <TitleRow>
        <ToolTips>
          {icon === "user" ? (
            <>
              <RightArrow /> <User />
            </>
          ) : (
            <>
              <Users />
            </>
          )}
        </ToolTips>
        {title}
      </TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default ReferralTooltip;
