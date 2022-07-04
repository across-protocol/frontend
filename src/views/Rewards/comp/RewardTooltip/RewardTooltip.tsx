import { Wrapper, TitleRow, Body, ToolTips } from "./RewardTooltip.styles";
import { ReactComponent as UserTooltip } from "assets/user-tooltip.svg";
import { ReactComponent as UsersTooltip } from "assets/users-tooltip.svg";

import { ReactComponent as RightDownArrow } from "assets/corner-down-right-tooltip.svg";
interface Props {
  icon: "user" | "users";
  title: string;
  body: string;
}

const ReferralTooltip: React.FC<Props> = ({ icon, title, body }) => {
  return (
    <Wrapper>
      <TitleRow>
        {icon === "user" && (
          <ToolTips>
            {" "}
            <RightDownArrow /> <UserTooltip />{" "}
          </ToolTips>
        )}
        {icon === "users" && <UsersTooltip />}
        {title}
      </TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default ReferralTooltip;
