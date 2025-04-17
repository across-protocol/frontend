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
  [AmountInputError.SWAP_QUOTE_UNAVAILABLE]:
    "Swap quote temporarily unavailable. Please try again later.",
};

type Props = {
  balance?: BigNumber;
  amountInput: string;
  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: () => void;
  selectedRoute: SelectedRoute;
  validationError?: AmountInputError;
  validationWarning?: AmountInputError;
  limits?: BridgeLimits;
};

export function AmountInput({
  balance,
  amountInput,
  onChangeAmountInput,
  onClickMaxBalance,
  selectedRoute,
  validationError,
  validationWarning,
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
          ? getValidationErrorText({
              validationError: validationError,
              selectedRoute,
              limits,
            })
          : undefined
      }
      validationWarning={
        validationWarning
          ? getValidationErrorText({
              validationError: validationWarning,
              selectedRoute,
              limits,
            })
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

function getValidationErrorText(props: {
  validationError?: AmountInputError;
  selectedRoute: SelectedRoute;
  limits?: BridgeLimits;
}) {
  if (!props.validationError) {
    return undefined;
  }
  return validationErrorTextMap[props.validationError]
    .replace("[INPUT_TOKEN]", props.selectedRoute.fromTokenSymbol)
    .replace(
      "[MAX_DEPOSIT]",
      `${formatUnitsWithMaxFractions(
        props.limits?.maxDeposit || 0,
        getToken(props.selectedRoute.fromTokenSymbol).decimals
      )} ${props.selectedRoute.fromTokenSymbol}`
    );
}

export default AmountInput;
