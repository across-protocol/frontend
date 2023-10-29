import styled from "@emotion/styled";

import { QUERIESV2 } from "utils";

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto 0px;
  justify-items: center;
`;

interface ITab {
  active: boolean;
}
export const Tab = styled.div<ITab>`
  flex-grow: 1;
  text-align: center;
  padding: 0 0 20px;
  border-bottom: ${(props) =>
    props.active ? "2px solid #e0f3ff" : "1px solid #3E4047"};
  cursor: pointer;
  color: ${(props) => (props.active ? "#E0F3FF" : "#9DAAB2")};

  @media ${QUERIESV2.sm.andDown} {
    padding: 0 0 12px;
  }
`;
