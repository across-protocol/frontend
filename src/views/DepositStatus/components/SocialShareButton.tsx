import styled from "@emotion/styled";
import { Text } from "components";
import { ReactComponent as TwitterLogo } from "assets/icons/x-grey.svg";
import { ReactComponent as FarcasterLogo } from "assets/icons/farcaster.svg";
import { COLORS } from "utils";

const SOCIAL_LOOKUP = {
  x: {
    name: "Twitter",
    intentUri: "https://twitter.com/intent/tweet?text=",
    logo: TwitterLogo,
  },
  farcaster: {
    name: "Farcaster",
    intentUri: "https://warpcast.com/~/compose?text=",
    logo: FarcasterLogo,
  },
};

type SocialButtonParamsType = {
  socialName: keyof typeof SOCIAL_LOOKUP;
  shareText: string;
};

const SocialShareButton = ({
  socialName,
  shareText,
}: SocialButtonParamsType) => {
  const social = SOCIAL_LOOKUP[socialName];

  const intentUrl = `${social.intentUri}${shareText}`;
  const Logo = social.logo;

  return (
    <WrapperButton href={intentUrl} target="_blank">
      <Text color="light-100">{social.name}</Text>
      <Logo />
    </WrapperButton>
  );
};

export default SocialShareButton;

const WrapperButton = styled.a`
  cursor: pointer;

  height: 40px;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  align-self: stretch;

  border-radius: 12px;
  border: 1px solid ${COLORS["grey-600"]};
  background: ${COLORS["grey-650"]};

  text-decoration: none;
`;
