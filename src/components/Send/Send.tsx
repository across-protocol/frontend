import React from "react";
import styled from "@emotion/styled";
import MaxWidthWrapper from "../MaxWidthWrapper";
import Network from "../Network";

const Send = () => {
  return (
    <MaxWidth size="sm">
      <Wrapper>
        <Section>
          <Network />
        </Section>
      </Wrapper>
    </MaxWidth>
  );
};

const MaxWidth = styled(MaxWidthWrapper)`
  height: 100%;
`;
const Wrapper = styled.section`
  background-color: var(--gray);
  color: var(--white);

  height: 100%;
`;

const Section = styled.section`
  border-bottom: 1px solid var(--primary-dark);
  padding: 35px 30px;
`;
export default Send;
