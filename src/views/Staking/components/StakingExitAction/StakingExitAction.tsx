import {
  Wrapper,
  Text,
  Logo,
  ExitIcon,
  TitleLogo,
} from "./StakingExitAction.styles";

type StakingExitActionAttributes = {
  poolName: string;
  exitLinkURI: string;
  poolLogoURI: string;
};

export const StakingExitAction = ({
  poolName,
  exitLinkURI,
  poolLogoURI,
}: StakingExitActionAttributes) => {
  return (
    <Wrapper to={exitLinkURI}>
      <ExitIcon />
      <TitleLogo>
        <Logo src={poolLogoURI} />
        <Text>{poolName} Pool</Text>
      </TitleLogo>
    </Wrapper>
  );
};

export default StakingExitAction;
