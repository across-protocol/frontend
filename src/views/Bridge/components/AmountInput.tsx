import { BigNumber } from "ethers";

import { AmountInput as BaseAmountInput } from "components/AmountInput";

import { AmountInputError, SelectedRoute } from "../utils";

type Props = {
  balance?: BigNumber;
  amountInput: string;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  selectedRoute: SelectedRoute;
  validationError?: AmountInputError;
};

export function AmountInput({
  balance,
  amountInput,
  onChangeAmountInput,
  onClickMaxBalance,
  selectedRoute,
  validationError,
}: Props) {
  return (
    <BaseAmountInput
      dataCy="bridge-amount-input"
      inputTokenSymbol={
        selectedRoute.type === "swap"
          ? selectedRoute.swapTokenSymbol
          : selectedRoute.fromTokenSymbol
      }
      validationError={validationError}
      onChangeAmountInput={onChangeAmountInput}
      onClickMaxBalance={onClickMaxBalance}
      balance={balance}
      displayBalance
      amountInput={amountInput}
      disableErrorText
    />
  );
}

export default AmountInput;
