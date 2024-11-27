import { BigNumber } from "ethers";

import { AmountInput as BaseAmountInput } from "components/AmountInput";

import { AmountInputError, SelectedRoute } from "../utils";
import { formatUnitsWithMaxFractions, getToken } from "utils";
import { BridgeLimits } from "hooks";

const validationErrorTextMap: Record<AmountInputError, string> = {
  [AmountInputError.INSUFFICIENT_BALANCE]:
    "Insufficient balance to process this transfer.",
  [AmountInputError.PAUSED_DEPOSITS]:
    "[INPUT_TOKEN] deposits are temporarily paused.",
  [AmountInputError.INSUFFICIENT_LIQUIDITY]:
    "Input amount exceeds limits set to maintain optimal service for all users. Decrease amount to [MAX_DEPOSIT] or lower.",
  [AmountInputError.INVALID]: "Only positive numbers are allowed as an input.",
  [AmountInputError.AMOUNT_TOO_LOW]:
    "The amount you are trying to bridge is too low.",
  [AmountInputError.PRICE_IMPACT_TOO_HIGH]:
    "Price impact is too high. Check back later when liquidity is restored.",
};

type Props = {
  balance?: BigNumber;
  amountInput: string;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  selectedRoute: SelectedRoute;
  validationError?: AmountInputError;
  limits?: BridgeLimits;
};

export function AmountInput({
  balance,
  amountInput,
  onChangeAmountInput,
  onClickMaxBalance,
  selectedRoute,
  validationError,
  limits,
}: Props) {
  return (
    <BaseAmountInput
      dataCy="bridge-amount-input"
      inputTokenSymbol={
        selectedRoute.type === "swap"
          ? selectedRoute.swapTokenSymbol
          : selectedRoute.fromTokenSymbol
      }
      validationError={
        validationError
          ? validationErrorTextMap[validationError]
              .replace("[INPUT_TOKEN]", selectedRoute.fromTokenSymbol)
              .replace(
                "[MAX_DEPOSIT]",
                `${formatUnitsWithMaxFractions(
                  limits?.maxDeposit || 0,
                  getToken(selectedRoute.fromTokenSymbol).decimals
                )} ${selectedRoute.fromTokenSymbol}`
              )
          : undefined
      }
      onChangeAmountInput={onChangeAmountInput}
      onClickMaxBalance={onClickMaxBalance}
      balance={balance}
      displayBalance
      amountInput={amountInput}
    />
  );
}

export default AmountInput;
