import { FC } from "react";
import styled from "@emotion/styled";

interface Props {
  numDots: number;
  // Indexed at 1.
  selected: number;
}

const DotsStepper: FC<Props> = ({ numDots, selected }) => {
  const numElements: JSX.Element[] = [];
  for (let i = 0; i < numDots; i++) {
    numElements.push(
      <div key={i} className={selected === i + 1 ? "selected" : ""} />
    );
  }
  return <DotWrapper>{numElements.map((element) => element)}</DotWrapper>;
};

const DotWrapper = styled.div`
  display: inline-flex;

  > div {
    width: 8px;
    height: 8px;
    margin: 2px 4px;
    border-radius: 50%;
    background-color: #636a70;
    opacity: 1;
    &.selected {
      background-color: #6cf9d8;
    }
  }
`;

export default DotsStepper;
