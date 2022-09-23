import { Wrapper, Title, Body, Content } from "./DiscordAuth.styles";
import Footer from "components/Footer";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import useDiscordAuth from "./useDiscordAuth";

const DiscordAuth = () => {
  const { errorAuthenticating } = useDiscordAuth();
  return (
    <Wrapper>
      <Content>
        <Title>Authenticating with Discord</Title>
        {errorAuthenticating ? (
          <Body>Connection failed.</Body>
        ) : (
          <Body>
            Finalizing connection
            <BouncingDotsLoader whiteIcons />
          </Body>
        )}
      </Content>
      <Footer />
    </Wrapper>
  );
};

export default DiscordAuth;
