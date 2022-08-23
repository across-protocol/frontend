import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { Wrapper, Text, Logo, ExitIcon } from "./StakingExitAction.styles";

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
      <ExitIcon icon={faChevronLeft} />
      <Logo src={poolLogoURI} />
      <Text>{poolName} Pool</Text>
    </Wrapper>
  );
};

export default StakingExitAction;
