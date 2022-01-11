import styled from "@emotion/styled";
import { COLORS } from "utils";

export const TabList = styled.ol`
  margin-top: 10px;
  padding-left: 0;
  display: flex;
  background-color: linear-gradient(#f5f5f5 86.46%, #eeeeee 100%);
`;

export const TabListItem = styled.li`
  flex-grow: 1;
  list-style: none;
  background-color: hsla(${COLORS.gray[500]} / 0.25);
  text-align: center;
  padding: 16px 0;
  width: 50%;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  transition: background-color 100ms linear, opacity 100ms linear;
  cursor: pointer;
  &:last-of-type {
    margin-left: 4px;
  }

  &.tab-active {
    background-color: var(--color-gray);
    cursor: default;
  }

  &:not(.tab-active):hover {
    background-color: hsla(${COLORS.gray[500]} / 0.3);
  }
`;
