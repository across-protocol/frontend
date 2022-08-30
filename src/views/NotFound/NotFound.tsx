import {
  Wrapper,
  Title,
  Body,
  Link,
  CloudWrapper,
  StyledEmptyCloud,
  Content,
} from "./NotFound.styles";
import Footer from "components/Footer";

interface Props {
  custom404Message?: string;
}
const NotFound: React.FC<Props> = ({ custom404Message }) => {
  return (
    <Wrapper>
      <Content>
        <CloudWrapper>
          <StyledEmptyCloud />
        </CloudWrapper>
        <Title>404</Title>
        <Body>{custom404Message || "Page not found"}</Body>
        <Link to="/">Go back to Across</Link>
      </Content>
      <Footer />
    </Wrapper>
  );
};

export default NotFound;
