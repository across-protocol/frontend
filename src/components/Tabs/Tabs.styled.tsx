import styled from "@emotion/styled";

export const TabList = styled.ol`
  margin-top: 10px;
  border-bottom: 1px solid #ccc;
  padding-left: 0;
  display: flex;
  background-color: linear-gradient(#f5f5f5 86.46%, #eeeeee 100%);
  font-weight: 700;
`;

export const TabListItem = styled.li`
  flex-grow: 1;
  list-style: none;
  margin-bottom: -1px;
  background-color: rgba(45, 46, 51, 0.25);
  text-align: center;
  padding: 1rem 0;
  cursor: pointer;
  width: 50%;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  &:nth-of-type(1) {
    margin-right: 2px;
  }

  &:nth-of-type(2) {
    margin-left: 2px;
  }

  &.tab-list-active {
    background-color: #2d2e33;
    border: solid var(--primary, 500);
    border-width: 4px 0px 0 0px;
    font-weight: 400;
  }
`;
