import {
  Wrapper,
  Title,
  Body,
  Link,
  CloudWrapper,
  StyledEmptyCloud,
} from "./NotFound.styles";

interface Props {
  custom404Message?: string;
}
const NotFound: React.FC<Props> = ({ custom404Message }) => {
  return (
    <Wrapper>
      <CloudWrapper>
        <StyledEmptyCloud />
      </CloudWrapper>
      <Title>404</Title>
      <Body>{custom404Message || "Page not found"}</Body>
      <Link to="/">Go back to Across</Link>
    </Wrapper>
  );
};

export default NotFound;
