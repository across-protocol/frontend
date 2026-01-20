import { useCallback, useMemo } from "react";
import { BigNumber } from "ethers";
import { EnrichedToken } from "../../ChainTokenSelector/ChainTokenSelectorModal";
import {
  convertTokenToUSD,
  convertUSDToToken,
  formatUnitsWithMaxFractions,
  formatUSD,
  withOpacity,
} from "../../../../../utils";
import { formatUnits } from "ethers/lib/utils";
import styled from "@emotion/styled";
import { useTrackToggleUnit } from "./useTrackToggleUnit";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { UnitType } from "../../../types";

export function ToggleUnitButton({
  unit,
  setUnit,
  amount,
  token,
}: {
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
  amount: BigNumber | null | undefined;
  token: EnrichedToken | null;
}) {
  const trackToggleUnit = useTrackToggleUnit();

  const convertedAmount = useMemo(() => {
    if (!amount || !token) return undefined;
    const amountStr = formatUnitsWithMaxFractions(amount, token.decimals);
    if (unit === "token") {
      return convertTokenToUSD(amountStr, token);
    } else {
      return convertUSDToToken(amountStr, token);
    }
  }, [amount, token, unit]);

  const toggleUnit = useCallback(() => {
    setUnit(unit === "token" ? "usd" : "token");
  }, [unit, setUnit]);

  const formattedConvertedAmount = (() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, token?.decimals)} ${token?.symbol}`;
  })();

  return (
    <UnitToggleButtonWrapper>
      <UnitToggleButton
        onClick={() => {
          trackToggleUnit();
          toggleUnit();
        }}
      >
        <ArrowsCross width={16} height={16} />{" "}
        <span>{formattedConvertedAmount}</span>
      </UnitToggleButton>
    </UnitToggleButtonWrapper>
  );
}

export const UnitToggleButton = styled.button`
  color: ${withOpacity("#e0f3ff", 0.5)};

  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;

  &:hover:not(:disabled) {
    svg {
      color: #e0f3ff;
    }
  }

  span {
    color: inherit;
    overflow: hidden;
    white-space: nowrap;
    min-width: 0;
    text-overflow: ellipsis;
  }

  svg {
    color: inherit;
  }
`;

export const UnitToggleButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;
