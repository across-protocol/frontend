import { Wrapper, TitleRow, Body } from "./RewardTooltip.styles";

interface Props {
  title: string;
  body: string;
}

const ReferralTooltip: React.FC<Props> = ({ title, body }) => {
  return (
    <Wrapper>
      <TitleRow>{title}</TitleRow>
      <Body>{body}</Body>
    </Wrapper>
  );
};

export default ReferralTooltip;
