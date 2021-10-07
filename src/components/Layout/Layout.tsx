import styled from "@emotion/styled";
import MaxWidthWrapper from "../MaxWidthWrapper";

const Layout: React.FC = ({ children }) => {
  return (
    <Bg>
      <MaxWidth size="sm">
        <Wrapper>{children}</Wrapper>
      </MaxWidth>
    </Bg>
  );
};
const Bg = styled.main`
  position: relative;
  height: 100%;

  background-image: linear-gradient(
    to right,
    var(--gray) 18%,
    var(--primary),
    var(--gray) 82%
  );
`;

const MaxWidth = styled(MaxWidthWrapper)`
  height: 100%;
`;
const Wrapper = styled.section`
  background-color: var(--gray);
  color: var(--white);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export default Layout;
