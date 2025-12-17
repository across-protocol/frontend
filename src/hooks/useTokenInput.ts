import { useCallback, useState } from "react";
import { BigNumber, utils } from "ethers";
import { convertUSDToToken } from "utils";
import { EnrichedToken } from "views/SwapAndBridge/components/ChainTokenSelector/ChainTokenSelectorModal";

export type UnitType = "usd" | "token";

type UseTokenInputProps = {
  token: EnrichedToken | null;
  setAmount: (amount: BigNumber | null) => void;
  unit?: UnitType;
  setUnit?: (unit: UnitType) => void;
};

type UseTokenInputReturn = {
  unit: UnitType;
  toggleUnit: () => void;
  handleInputChange: (value: number | undefined) => void;
  handleBalanceClick: (amount: BigNumber) => void;
};

export default function useTokenInput({
  token,
  setAmount,
  unit: externalUnit,
  setUnit: externalSetUnit,
}: UseTokenInputProps): UseTokenInputReturn {
  const [internalUnit, setInternalUnit] = useState<UnitType>("token");

  const unit = externalUnit ?? internalUnit;
  const setUnit = externalSetUnit ?? setInternalUnit;

  const toggleUnit = useCallback(() => {
    setUnit(unit === "token" ? "usd" : "token");
  }, [unit, setUnit]);

  const handleInputChange = useCallback(
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

  const handleBalanceClick = useCallback(
    (amount: BigNumber) => {
      setAmount(amount);
    },
    [setAmount]
  );

  return {
    unit,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  };
}
