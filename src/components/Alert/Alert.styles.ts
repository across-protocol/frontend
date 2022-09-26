import styled from "@emotion/styled";
import { AlertStatusType } from "./Alert";
import { ReactComponent as InfoIcon } from "assets/icons/info-24.svg";

const AlertColors: Record<
  AlertStatusType,
  { bgColor: string; fontColor: string; borderColor: string }
> = {
  warn: {
    bgColor: "rgba(249, 210, 108, 0.05)",
    fontColor: "#f9d26c",
    borderColor: "rgba(249, 210, 108, 0.1)",
  },
};

type IncludeStatusType = {
  status: AlertStatusType;
};
export const Wrapper = styled.div<IncludeStatusType>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;

  gap: 14px;
  padding: 16px;

  font-size: 16px;
  line-height: 20px;
  font-weight: 400;

  border: 1px solid;
  border-radius: 12px;

  background-color: ${({ status }) => AlertColors[status].bgColor};
  color: ${({ status }) => AlertColors[status].fontColor};
  border-color: ${({ status }) => AlertColors[status].borderColor};
`;

export const ChildrenWrapper = styled.div``;

export const StyledInfoIcon = styled(InfoIcon)<IncludeStatusType>`
  flex-shrink: 0;

  & path {
    stroke: ${({ status }) => AlertColors[status].fontColor};
  }
`;
