import { BigNumber } from "ethers";

import { AmountInput as BaseAmountInput } from "components/AmountInput";
import { Route } from "utils";

import { AmountInputError } from "../utils";

type Props = {
  balance?: BigNumber;
  amountInput: string;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  selectedRoute: Route;
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
      inputTokenSymbol={selectedRoute.fromTokenSymbol}
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
