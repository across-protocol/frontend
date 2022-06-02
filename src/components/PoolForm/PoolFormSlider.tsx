import { FC, Dispatch, SetStateAction } from "react";
import ReactSlider from "react-slider";
import styled from "@emotion/styled";
interface Props {
  value: number;
  setValue: Dispatch<SetStateAction<number>>;
  setRA: (v: number) => void;
}
const PoolFormSlider: FC<Props> = ({ value, setValue, setRA }) => {
  return (
    <Slider
      className="PoolForm-slider"
      defaultValue={value}
      value={value}
      thumbClassName="PoolForm-thumb"
      trackClassName="PoolForm-track"
      onChange={(v) => {
        if (typeof v === "number") {
          setValue(v);
          setRA(v);
        }
      }}
      renderThumb={(props, state) => <div {...props} />}
    />
  );
};

export default PoolFormSlider;

const Slider = styled(ReactSlider)`
  .PoolForm-thumb {
    height: 34px;
    width: 34px;
    background-color: var(--color-primary);
    border-radius: 16px;
    border: 3px solid var(--color-white);
    margin-bottom: -8px;
    top: -17px;
    cursor: pointer;
    &:focus {
      outline: none;
    }
    &:hover {
      background-color: var(--color-uma-red);
    }
  }
  .PoolForm-track {
    height: 3px;
    background-color: var(--color-white);
  }
`;
