import styled from "@emotion/styled";
import { AlertStatusType } from "./Alert";
import { ReactComponent as InfoIcon } from "assets/icons/info-24.svg";
import { ReactComponent as QuestionIcon } from "assets/icons/question-24.svg";
import { QUERIESV2 } from "utils";

const AlertColors: Record<
  AlertStatusType,
  { bgColor: string; fontColor: string; borderColor: string }
> = {
  base: {
    bgColor: "#2d2e33",
    fontColor: "#9daab3",
    borderColor: "#3e4047",
  },
  warn: {
    bgColor: "rgba(249, 210, 108, 0.05)",
    fontColor: "#f9d26c",
    borderColor: "rgba(249, 210, 108, 0.1)",
  },
  danger: {
    bgColor: "rgba(249, 108, 108, 0.05)",
    fontColor: "#f96c6c",
    borderColor: "rgba(249, 108, 108, 0.1)",
  },
  info: {
    bgColor: "rgba(68, 210, 255, 0.1)",
    fontColor: "rgba(68, 210, 255, 1)",
    borderColor: "rgba(68, 210, 255, 0.1)",
  },
};

type IncludeStatusType = {
  status: AlertStatusType;
  align?: "top" | "center";
};
export const Wrapper = styled.div<IncludeStatusType>`
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: ${({ align }) => (align === "top" ? "flex-start" : "center")};
  justify-content: flex-start;

  gap: 14px;
  padding: 18px 16px;

  font-size: 16px;
  line-height: 20px;
  font-weight: 400;

  border: 1px solid;
  border-radius: 12px;

  background-color: ${({ status }) => AlertColors[status].bgColor};
  color: ${({ status }) => AlertColors[status].fontColor};
  border-color: ${({ status }) => AlertColors[status].borderColor};

  @media ${QUERIESV2.tb.andDown} {
    font-size: 14px;
    line-height: 18px;
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 12px;
    gap: 12px;
  }
`;

export const ChildrenWrapper = styled.div`
  width: 100%;
`;

export const StyledQuestionIcon = styled(QuestionIcon)<IncludeStatusType>`
  flex-shrink: 0;

  & path {
    stroke: ${({ status }) => AlertColors[status].fontColor};
  }

  height: 24px;
  width: 24px;
  @media ${QUERIESV2.tb.andDown} {
    height: 20px;
    width: 20px;
  }
  @media ${QUERIESV2.sm.andDown} {
    height: 16px;
    width: 16px;
  }
`;

export const StyledInfoIcon = styled(InfoIcon)<IncludeStatusType>`
  flex-shrink: 0;

  & path {
    stroke: ${({ status }) => AlertColors[status].fontColor};
  }

  height: 24px;
  width: 24px;
  @media ${QUERIESV2.tb.andDown} {
    height: 20px;
    width: 20px;
  }
  @media ${QUERIESV2.sm.andDown} {
    height: 16px;
    width: 16px;
  }
`;
