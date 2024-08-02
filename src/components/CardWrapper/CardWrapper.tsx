import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <Card>{children}</Card>
);

export default CardWrapper;

const Card = styled.div`
  width: 100%;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  background: #34353b;

  border: 1px solid #3e4047;
  border-radius: 10px;

  flex-wrap: nowrap;

  padding: 24px;
  gap: 24px;
  @media ${QUERIESV2.sm.andDown} {
    padding: 12px 16px 16px;
    gap: 16px;
    margin-top: -4px;
  }
`;
