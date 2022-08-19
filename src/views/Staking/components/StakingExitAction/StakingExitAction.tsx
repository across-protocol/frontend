import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { tokenList } from "utils";
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
};

export const StakingExitAction = ({
  poolId,
  exitLinkURI,
}: StakingExitActionAttributes) => {
  return (
    <Wrapper>
      <StylizedLink to={exitLinkURI}>
        <ExitIcon icon={faChevronLeft} />
      </StylizedLink>
      <Logo src={tokenList[0].logoURI} />
      <Text>{poolId.toUpperCase()} Pool</Text>
    </Wrapper>
  );
};

export default StakingExitAction;
