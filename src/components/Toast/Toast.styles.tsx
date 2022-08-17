import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import { ToastPosition, ToastType } from "./toast.d";
import { ReactComponent as CloseIcon } from "assets/icons/cross.svg";
import { ReactComponent as UnstyledInfoIcon } from "assets/icons/info-24.svg";
import { ReactComponent as UnstyledSmInfoIcon } from "assets/icons/info-16.svg";

interface IWrapper {
  position: ToastPosition;
}
export const ToastContainer = styled.div<IWrapper>`
  font-size: 14px;
  position: fixed;
  z-index: 999999;
  width: 400px;
  background-color: transparent;
  overflow: hidden;
  top: ${({ position }) => {
    if (position === "top-right" || position === "top-left") {
      return "12px";
    } else {
      return "0;";
    }
  }};
  right: ${({ position }) => {
    if (position === "top-right" || position === "bottom-right") {
      return "12px";
    } else {
      return "0";
    }
  }};
  transition: ${({ position }) => {
    if (position === "top-right" || position === "bottom-right") {
      return "transform 0.6s ease-in-out";
    } else {
      return "transform 0.6s ease-in";
    }
  }};
  animation: ${({ position }) => {
    if (position === "top-right" || position === "bottom-right") {
      return css`
        ${toastInRight} 0.7s
      `;
    } else {
      return css`
        ${toastInLeft} 0.7s
      `;
    }
  }};
  @media screen and (max-width: 428px) {
    width: 100%;
    right: 0;
    left: 0;
  }
`;

interface IToastWrapper {
  type: ToastType;
}

export const ToastWrapper = styled.div<IToastWrapper>`
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  margin: 0.66rem 0;
  border: ${({ type }) => {
    if (type === "info") {
      return "1px solid #E0F3FF";
    } else if (type === "warning") {
      return "1px solid #F9D26C";
    } else if (type === "error") {
      return "1px solid #F96C6C";
    } else {
      // Success case. not defined yet.
      return "1px solid #3e4047";
    }
  }};
  @media screen and (max-width: 428px) {
    width: calc(100% - 24px);
    margin-left: auto;
    margin-right: auto;
  }
`;

export const ToastElement = styled.div`
  overflow: hidden;
  background-color: #202024;
  transition: 0.3s ease;
  position: relative;
  pointer-events: auto;
  color: #e0f3ff;
  padding: 22px;
  width: 100%;
  box-shadow: 0px 12px 24px rgba(0, 0, 0, 0.24);
  font-weight: 400;
`;

export const ImageWrapper = styled.div`
  margin-right: 15px;
`;

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`;

interface ITitle {
  type: ToastType;
}
export const Title = styled.div<ITitle>`
  font-weight: 700;
  font-size: ${14 / 16}rem;
  text-align: left;
  width: 300px;
  line-height: 18px;

  color: ${({ type }) => {
    if (type === "info") {
      return "#E0F3FF";
    } else if (type === "warning") {
      return "#F9D26C";
    } else if (type === "error") {
      return "#F96C6C";
    } else {
      // Success case. not defined yet.
      return "#3e4047";
    }
  }};
  @media screen and (max-width: 428px) {
    width: 100%;
  }
`;

export const Body = styled.div`
  margin: 0;
  text-align: left;
  white-space: nowrap;
  color: #c5d5e0;
  line-height: 16px;
  font-size: ${12 / 16}rem;
`;

export const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const CloseButton = styled(CloseIcon)`
  cursor: pointer;
  align-self: baseline;
  margin-top: 4px;
`;

interface IInfoIcon {
  type: ToastType;
}
export const InfoIcon = styled(UnstyledInfoIcon)<IInfoIcon>`
  path {
    stroke: ${({ type }) => {
      if (type === "info") {
        return "#9DAAB2";
      } else if (type === "warning") {
        return "#F9D26C";
      } else if (type === "error") {
        return "#F96C6C";
      } else {
        // Success case. not defined yet.
        return "#3e4047";
      }
    }};
  }
`;

export const SmInfoIcon = styled(UnstyledSmInfoIcon)<IInfoIcon>`
  path {
    stroke: ${({ type }) => {
      if (type === "info") {
        return "#9DAAB2";
      } else if (type === "warning") {
        return "#F9D26C";
      } else if (type === "error") {
        return "#F96C6C";
      } else {
        // Success case. not defined yet.
        return "#3e4047";
      }
    }};
  }
`;
export const CloseWrapper = styled.div`
  margin-left: none;
  @media screen and (max-width: 428px) {
    margin-left: auto;
  }
`;
const toastInRight = keyframes`
  
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

const toastInLeft = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;
