import styled from "@emotion/styled";
import { ReactComponent as ExternalLinkUnstyledIcon } from "assets/icons/external-link-12.svg";

export const Wrapper = styled.div`
  margin: 16px auto 0;
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #9daab2;
  text-align: center;

  span {
    margin-top: 8px;
  }

  a {
    margin: 8px 0 0 8px;
    color: #e0f3ff;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.1s;

    svg {
      margin-left: 2px;

      path {
        fill: #e0f3ff;
      }
    }

    :hover {
      opacity: 0.8;
    }
  }

  @media (max-width: 428px) {
    margin: 8px auto 0;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const ExternalLinkIcon = styled(ExternalLinkUnstyledIcon)``;
