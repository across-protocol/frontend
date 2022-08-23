import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;
  max-width: 600px;
  margin: 67px auto 27px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media ${QUERIESV2.sm} {
    margin: 16px auto 122px;
    width: 404px;
  }
`;
