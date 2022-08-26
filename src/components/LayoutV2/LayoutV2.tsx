import styled from "@emotion/styled";
import Footer from "components/Footer";
import { QUERIESV2 } from "utils";

const LayoutV2: React.FC = ({ children }) => {
  return (
    <Wrapper>
      <InnerWrapper>{children}</InnerWrapper>
      <Footer />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Subtract to account for header */
  min-height: calc(100% - 72px);
  @media ${QUERIESV2.sm} {
    /* Subtract to account for header */
    min-height: calc(100% - 64px);
  } ;
`;

const InnerWrapper = styled.div`
  background-color: transparent;

  max-width: 600px;
  width: calc(100% - 24px);

  min-height: fit-content;

  margin: 64px auto 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${QUERIESV2.sm} {
    margin: 16px auto;
  }
`;

export default LayoutV2;
