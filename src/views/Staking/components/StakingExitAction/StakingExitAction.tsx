import BreadcrumbV2 from "components/BreadcrumbV2";
import { Text, Logo, TitleLogo } from "./StakingExitAction.styles";

type StakingExitActionAttributes = {
  poolName: string;
  poolLogoURI: string;
};

export const StakingExitAction = ({
  poolName,
  poolLogoURI,
}: StakingExitActionAttributes) => (
  <BreadcrumbV2
    onlyRootAncestor
    customCurrentRoute={
      <TitleLogo>
        <Logo src={poolLogoURI} />
        <Text>Pool ({poolName})</Text>
      </TitleLogo>
    }
  />
);

export default StakingExitAction;
