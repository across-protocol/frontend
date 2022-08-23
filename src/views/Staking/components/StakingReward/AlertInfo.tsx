import {
  AlertInfoWrapper,
  InfoIcon,
  InfoText,
  InfoTextWrapper,
} from "./StakingReward.styles";

type AlertInfoPropType = {
  danger?: boolean;
};

export const AlertInfo: React.FC<AlertInfoPropType> = ({
  danger,
  children,
}) => {
  const Wrapper = !!danger ? AlertInfoWrapper : InfoTextWrapper;
  return (
    <Wrapper>
      <InfoIcon />
      <InfoText>{children}</InfoText>
    </Wrapper>
  );
};
