import { FC, Dispatch, SetStateAction } from "react";
import PoolFormSlider from "./PoolFormSlider";

import {
  RemoveAmount,
  RemovePercentButtonsWrapper,
  RemovePercentButton,
  RemoveFormButton,
  RemoveFormButtonWrapper,
} from "./RemoveLiquidityForm.styles";

interface Props {
  removeAmount: number;
  setRemoveAmount: Dispatch<SetStateAction<number>>;
}
const RemoveLiqudityForm: FC<Props> = ({ removeAmount, setRemoveAmount }) => {
  return (
    <>
      <RemoveAmount>
        Amount: <span>{removeAmount}%</span>
      </RemoveAmount>
      <PoolFormSlider value={removeAmount} setValue={setRemoveAmount} />
      <RemovePercentButtonsWrapper>
        <RemovePercentButton onClick={() => setRemoveAmount(25)}>
          25%
        </RemovePercentButton>
        <RemovePercentButton onClick={() => setRemoveAmount(50)}>
          50%
        </RemovePercentButton>
        <RemovePercentButton onClick={() => setRemoveAmount(75)}>
          75%
        </RemovePercentButton>
        <RemovePercentButton onClick={() => setRemoveAmount(100)}>
          Max
        </RemovePercentButton>
      </RemovePercentButtonsWrapper>
      <RemoveFormButtonWrapper>
        <RemoveFormButton>Remove liquidity</RemoveFormButton>
      </RemoveFormButtonWrapper>
    </>
  );
};

export default RemoveLiqudityForm;
