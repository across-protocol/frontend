import BreadcrumbV2 from "components/BreadcrumbV2";
import { IconPair } from "components/IconPair";

import {
  Text,
  Logo,
  TitleLogo,
  IconPairContainer,
} from "./StakingExitAction.styles";
import { isDefined } from "utils";

type StakingExitActionAttributes = {
  poolName: string;
  poolLogoURI: string;
  poolLogoURIs?: [string, string];
};

export const StakingExitAction = ({
  poolName,
  poolLogoURI,
  poolLogoURIs,
}: StakingExitActionAttributes) => (
  <BreadcrumbV2
    onlyRootAncestor
    customCurrentRoute={
      <TitleLogo extendWidth={isDefined(poolLogoURIs)}>
        {poolLogoURIs ? (
          <IconPairContainer>
            <IconPair
              LeftIcon={<Logo src={poolLogoURIs[0]} />}
              RightIcon={<Logo src={poolLogoURIs[1]} />}
            />
          </IconPairContainer>
        ) : (
          <Logo src={poolLogoURI} />
        )}
        <Text>Pool ({poolName})</Text>
      </TitleLogo>
    }
  />
);

export default StakingExitAction;
