import styled from "@emotion/styled";
import { css, keyframes } from "@emotion/react";
import { ToastPosition } from "./toast.d";

interface IWrapper {
  position: ToastPosition;
}
export const Wrapper = styled.div<IWrapper>`
  font-size: 14px;
  box-sizing: border-box;
  position: fixed;
  z-index: 999999;
  color: #ffffff;
  width: 400px;
  border: 1px solid #3e4047;
  background-color: #202024;
  box-shadow: 0px 12px 24px rgba(0, 0, 0, 0.24);
  border-radius: 10px;
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
`;

export const ToastElement = styled.div`
  background-color: #000;
  transition: 0.3s ease;
  position: relative;
  pointer-events: auto;
  color: #e0f3ff;
  opacity: 0.9;
  background-position: 15px;
  background-repeat: no-repeat;
  padding: 22px;
  width: 100%;
`;

export const ImageWrapper = styled.div`
  margin-right: 15px;
  img {
    width: 24px;
    height: 24px;
  }
`;

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 5px;
`;

export const Title = styled.div`
  font-weight: 700;
  font-size: 16px;
  text-align: left;
  margin-top: 0;
  margin-bottom: 6px;
  width: 300px;
  height: 18px;
`;

export const Body = styled.div`
  margin: 0;
  text-align: left;
  white-space: nowrap;
  color: #c5d5e0;
`;

export const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const CloseButton = styled.img`
  cursor: pointer;
  align-self: baseline;
  margin-top: 4px;
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
