import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import {
  Wrapper,
  Text,
  StylizedLink,
  Logo,
  ExitIcon,
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
    <Wrapper>
      <StylizedLink to={exitLinkURI}>
        <ExitIcon icon={faChevronLeft} />
      </StylizedLink>
      <Logo src={poolLogoURI} />
      <Text>{poolName} Pool</Text>
    </Wrapper>
  );
};

export default StakingExitAction;
