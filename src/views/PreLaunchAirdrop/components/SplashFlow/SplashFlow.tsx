import styled from "@emotion/styled";
import { ReactComponent as IIcon } from "assets/sample-airdrop-icon.svg";
import AirdropCard from "../AirdropCard";
import TitleSection from "./TitleSection";

const SplashFlow = () => (
  <>
    <TitleSection />
    <TestDiv>
      <AirdropCard
        Icon={TestIcon}
        check={"undetermined"}
        title="Across Community Member"
        description="Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet."
      />
      <AirdropCard
        Icon={TestIcon}
        check={"undetermined"}
        title="Across Liquidity Provider"
        description="Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet."
        externalLink="/"
      />
      <AirdropCard
        Icon={TestIcon}
        check={"eligible"}
        title="Across Community Member"
        description="Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet."
      />
      <AirdropCard
        Icon={TestIcon}
        check={"ineligible"}
        title="Across Community Member"
        description="Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet."
      />
      <AirdropCard
        Icon={TestIcon}
        title="Across Community Member"
        description="Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet."
      />
    </TestDiv>
  </>
);

export default SplashFlow;

const TestIcon = styled(IIcon)`
  height: 200px;
  width: 200px;
`;
const TestDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding: 64px 0;
`;
