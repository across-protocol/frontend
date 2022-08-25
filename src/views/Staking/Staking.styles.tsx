import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;

  max-width: 600px;
  width: calc(100% - 24px);

  margin: 64px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media ${QUERIESV2.sm} {
    margin: 16px auto;
  }
`;
