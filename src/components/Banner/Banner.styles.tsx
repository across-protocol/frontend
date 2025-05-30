import styled from "@emotion/styled";
import { QUERIESV2, COLORS } from "utils";

export const Wrapper = styled.div<{
  type?: "info" | "success";
  onClick?: () => void;
}>`
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30px;
  height: 56px;
  background-color: ${({ type }) =>
    type === "success" ? COLORS.aqua : COLORS["grey-400"]};
  border-bottom: 1px solid #3e4047;
  font-size: ${16 / 16}rem;
  position: unset;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1100;

  @media ${QUERIESV2.tb.andDown} {
    padding: 0 10px;
  }
  svg {
    margin-right: 16px;
  }

  span {
    padding: 10px 0;
    @media screen and (max-width: 428px) {
      font-size: ${14 / 16}rem;
      width: 85%;
    }
  }
`;
