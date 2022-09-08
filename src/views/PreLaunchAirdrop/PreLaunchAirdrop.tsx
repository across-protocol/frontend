import Footer from "components/Footer";
import { TitleSection } from "./components";
import {
  BackgroundLayer,
  ContentWrapper,
  Wrapper,
} from "./PreLaunchAirdrop.styles";

const PreLaunchAirdrop = () => {
  return (
    <Wrapper>
      <BackgroundLayer />
      <ContentWrapper>
        <TitleSection />
      </ContentWrapper>
      <Footer />
    </Wrapper>
  );
};

export default PreLaunchAirdrop;
