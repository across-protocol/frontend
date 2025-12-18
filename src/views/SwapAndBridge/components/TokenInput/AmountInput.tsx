import { useCallback, useState } from "react";
import { NumericFormat } from "react-number-format";
import { BigNumber, utils } from "ethers";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { TokenAmountInput, TokenAmountInputWrapper } from "./styles";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
} from "../../../../utils";
import { UnitType } from "../../types";

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
  setAmount: (amount: BigNumber | null) => void;
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
  setAmount,
  inputRef,
}: AmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = formatAmountForDisplay(amount, token, unit);

  const handleValueChange = useCallback(
    (value: number | undefined) => {
      if (value === undefined || value <= 0) {
        setAmount(null);
        return;
      }
      if (!token) {
        setAmount(null);
        return;
      }
      if (unit === "token") {
        const parsed = utils.parseUnits(value.toString(), token.decimals);
        setAmount(parsed);
      } else {
        const tokenValue = convertUSDToToken(value.toString(), token);
        setAmount(tokenValue);
      }
    },
    [setAmount, token, unit]
  );

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
            handleValueChange(values.floatValue);
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
