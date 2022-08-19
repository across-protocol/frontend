import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import {
  Wrapper,
  Text,
  StylizedLink,
  Logo,
  ExitIcon,
} from "./StakingExitAction.styles";

type StakingExitActionAttributes = {
  poolId: string;
  exitLinkURI: string;
  poolLogoURI: string;
};

export const StakingExitAction = ({
  poolId,
  exitLinkURI,
  poolLogoURI,
}: StakingExitActionAttributes) => {
  return (
    <Wrapper>
      <StylizedLink to={exitLinkURI}>
        <ExitIcon icon={faChevronLeft} />
      </StylizedLink>
      <Logo src={poolLogoURI} />
      <Text>{poolId.toUpperCase()} Pool</Text>
    </Wrapper>
  );
};

export default StakingExitAction;
