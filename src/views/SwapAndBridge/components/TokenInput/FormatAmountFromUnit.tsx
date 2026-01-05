import { BigNumber, utils } from "ethers";
import { EnrichedToken } from "../ChainTokenSelector/ChainTokenSelectorModal";
import { UnitType } from "../../types";
import {
  convertTokenToUSD,
  formatUnitsWithMaxFractions,
} from "../../../../utils";

export function formatAmountFromUnit(
  amount: BigNumber | null | undefined,
  token: EnrichedToken | null,
  unit: UnitType
): string {
  if (!amount || !token) return "";
  if (unit === "token") {
    return formatUnitsWithMaxFractions(amount, token.decimals);
  } else {
    const tokenAmountFormatted = formatUnitsWithMaxFractions(
      amount,
      token.decimals
    );
    const usdValue = convertTokenToUSD(tokenAmountFormatted, token);
    return utils.formatUnits(usdValue, 18);
  }
}
