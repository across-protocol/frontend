import styled from "@emotion/styled";
import Footer from "components/Footer";
import { QUERIESV2 } from "utils";

type LayoutProp = {
  maxWidth?: number;
};

const LayoutV2: React.FC<LayoutProp> = ({ maxWidth, children }) => {
  return (
    <Wrapper>
      <InnerWrapper maxWidth={maxWidth ?? 600}>{children}</InnerWrapper>
      <Footer />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background-color: #2d2e33;

  /* Subtract to account for header */
  min-height: calc(100vh - 72px);
  @media ${QUERIESV2.sm.andDown} {
    /* Subtract to account for header */
    min-height: calc(100vh - 64px);
  }
`;

const InnerWrapper = styled.div<{ maxWidth: number }>`
  background-color: transparent;
  width: 100%;
  min-height: fit-content;
  margin: 0px auto 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  padding: 0px 24px;
  max-width: ${({ maxWidth }) => maxWidth + 48}px;
  @media ${QUERIESV2.sm.andDown} {
    margin: 0px auto;
    padding: 0px 12px;
    max-width: ${({ maxWidth }) => maxWidth + 24}px;
  }
`;

export default LayoutV2;
