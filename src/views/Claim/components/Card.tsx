import styled from "@emotion/styled";

import { QUERIESV2 } from "utils/constants";

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 24px;

  background: #34353b;

  border: 1px solid #3e4047;
  border-radius: 10px;

  @media ${QUERIESV2.sm} {
    padding: 16px;
  }
`;

export const LightCard = styled(Card)`
  background-color: #3e4047;
  border-color: #4c4e57;
`;
