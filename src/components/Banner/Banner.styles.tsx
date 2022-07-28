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
  @media ${QUERIES.tabletAndDown} {
    padding: 0 10px;
  }
  svg {
    margin-right: 16px;
  }

  span {
    padding: 10px 0;
    @media ${QUERIES.tabletAndDown} {
      font-size: ${13 / 16}rem;
    }
    @media ${QUERIES.mobileAndDown} {
      width: 85%;
    }
  }
`;
