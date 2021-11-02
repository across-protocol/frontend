import { FC } from "react";
import styled from "@emotion/styled";

export type BounceType = "default | big";

interface Props {
  type?: BounceType;
}

const BouncingDotsLoader: FC<Props> = ({ type = "default" }) => {
  if (type === "big")
    return (
      <BigBouncingWrapper>
        <div />
        <div />
        <div />
      </BigBouncingWrapper>
    );
  return (
    <BouncingWrapper>
      <div />
      <div />
      <div />
    </BouncingWrapper>
  );
};

const BouncingWrapper = styled.div`
  display: inline-flex;
  margin-left: 4px;

  > div {
    width: 6px;
    height: 6px;
    margin: 2px 4px;
    border-radius: 50%;
    background-color: var(--color-gray);
    opacity: 1;
    animation: bouncing-loader 0.6s infinite alternate;
  }

  @keyframes bouncing-loader {
    to {
      transform: translateY(-8px);
    }
  }

  > div:nth-child(2) {
    animation-delay: 0.2s;
  }

  > div:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const BigBouncingWrapper = styled(BouncingWrapper)`
  margin-left: 0;
  display: inline-flex;
  > div {
    height: 12px;
    width: 12px;
  }
`;

export default BouncingDotsLoader;
