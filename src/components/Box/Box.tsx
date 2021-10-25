import styled from "@emotion/styled";

export const RoundBox = styled.div`
  --radius: 30px;
  border-radius: var(--radius);
  padding: 15px 20px;
  background-color: var(--color-gray-300);
`;
export const ErrorBox = styled(RoundBox)`
  background-color: var(--color-error);
  color: var(--color-gray);
`;
