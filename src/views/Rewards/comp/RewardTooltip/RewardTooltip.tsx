import { Wrapper, TitleRow, Body } from "./RewardTooltip.styles";
import "./rewards.scss";

interface Props {
  icon: "user" | "users";
  title: string;
  body: string;
}

const ReferralTooltip: React.FC<Props> = ({ icon, title, body }) => {
  return (
    <Wrapper>
      <TitleRow>{title}</TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default ReferralTooltip;
