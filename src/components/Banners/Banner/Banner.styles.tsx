import styled from "@emotion/styled";
import { QUERIES } from "utils";
export const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30px;
  height: 72px;
  color: #e0f3ff;
  background-color: #202024;
  border-bottom: 1px solid #3e4047;
  font-size: ${16 / 16}rem;
  position: unset;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1100;
  @media ${QUERIES.tabletAndDown} {
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
