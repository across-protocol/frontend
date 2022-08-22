import {
  AlertInfoWrapper,
  InfoIcon,
  InfoText,
  InfoTextWrapper,
} from "./StakingReward.styles";

type AlertInfoPropType = {
  danger?: boolean;
  text: string;
};

export const AlertInfo = ({ danger, text }: AlertInfoPropType) => {
  const Wrapper = !!danger ? AlertInfoWrapper : InfoTextWrapper;
  return (
    <Wrapper>
      <InfoIcon />
      <InfoText>{text}</InfoText>
    </Wrapper>
  );
};
