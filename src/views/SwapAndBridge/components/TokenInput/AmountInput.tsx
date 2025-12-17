import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { BigNumber, utils } from "ethers";
import { UnitType } from "hooks";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { TokenAmountInput, TokenAmountInputWrapper } from "./styles";
import {
  convertTokenToUSD,
  formatUnitsWithMaxFractions,
} from "../../../../utils";

export function formatAmountForDisplay(
  amount: BigNumber | null | undefined,
  token: EnrichedToken | null,
  unit: UnitType
): string {
  if (!amount || !token) return "";
  if (unit === "token") {
    return formatUnitsWithMaxFractions(amount, token.decimals);
  }
  const tokenAmountFormatted = formatUnitsWithMaxFractions(
    amount,
    token.decimals
  );
  const usdValue = convertTokenToUSD(tokenAmountFormatted, token);
  return utils.formatUnits(usdValue, 18);
}

type AmountInputProps = {
  id: string;
  name: string;
  testId?: string;
  amount: BigNumber | null | undefined;
  token: EnrichedToken | null;
  unit: UnitType;
  shouldUpdate: boolean;
  disabled: boolean;
  error: boolean;
  onInputChange: (value: number | undefined) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
};

export const AmountInput = ({
  id,
  name,
  testId,
  amount,
  token,
  unit,
  shouldUpdate,
  disabled,
  error,
  onInputChange,
  inputRef,
}: AmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = formatAmountForDisplay(amount, token, unit);

  return (
    <TokenAmountInputWrapper
      showPrefix={unit === "usd"}
      value={displayValue}
      error={error}
    >
      <NumericFormat
        customInput={TokenAmountInput}
        getInputRef={inputRef}
        id={id}
        name={name}
        data-testid={testId}
        placeholder="0.00"
        value={isFocused && !shouldUpdate ? undefined : displayValue}
        onValueChange={(values, sourceInfo) => {
          if (sourceInfo.source === "event" && isFocused) {
            onInputChange(values.floatValue);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        thousandSeparator=","
        decimalSeparator="."
        allowNegative={false}
        disabled={disabled}
        error={error}
      />
    </TokenAmountInputWrapper>
  );
};
