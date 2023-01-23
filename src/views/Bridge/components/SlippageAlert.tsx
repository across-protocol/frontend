import styled from "@emotion/styled";
import { ampli } from "ampli";
import { Alert } from "components";
import { Text } from "components/Text";
import { useState } from "react";
import FeeInformationModal from "./FeeInformationModal";

const SlippageAlert = () => {
  const [displayModal, setDisplayModal] = useState(false);
  const displayModalHandler = () => {
    setDisplayModal(true);
    ampli.feesInfoExpanded();
  };
  return (
    <>
      <Alert iconType="question" status="info">
        <Wrapper>
          <Text color="white-100" size="md">
            All transfers are slippage free.
          </Text>
          <Link color="teal" size="md" onClick={displayModalHandler}>
            Learn more
          </Link>
        </Wrapper>
      </Alert>
      <FeeInformationModal
        displayModal={displayModal}
        displayModalCloseHandler={() => setDisplayModal(false)}
      />
    </>
  );
};

export default SlippageAlert;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  padding-top: 1px;
  gap: 12px;

  width: 100%;
`;

const Link = styled(Text)`
  cursor: pointer;
`;
