import styled from "@emotion/styled";
import React from "react";

type EligibilityPillType = {
  eligible?: boolean;
};

const EligibilityPill = ({ eligible }: EligibilityPillType) => {
  const pillText = eligible ? "eligible" : "ineligible";
  return <PillWrapper eligible={eligible}>{pillText}</PillWrapper>;
};

export default React.memo(EligibilityPill);

const PillWrapper = styled.div<EligibilityPillType>`
  display: flex;
  align-items: center;
  justify-content: center;

  width: fit-content;
  height: 24px;

  padding: 0px 10px 2px;
  border-radius: 24px;

  color: ${({ eligible }) => (eligible ? "#6CF9D8" : "#F96C6C")};
  background-color: ${({ eligible }) => (eligible ? "#364C4C" : "#4C3636;")};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
`;
