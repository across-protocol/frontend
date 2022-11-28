import styled from "@emotion/styled";

type Props = {
  backgroundColor: string;
};

export const Pill = styled.div<Props>`
  display: flex;
  align-items: center;
  justify-content: center;

  width: fit-content;
  height: 24px;

  padding: 0px 10px 2px;
  border-radius: 24px;

  background-color: ${({ backgroundColor }) => backgroundColor};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
`;

export default Pill;
