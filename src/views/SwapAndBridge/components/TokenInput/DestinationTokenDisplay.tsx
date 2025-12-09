import { formatUnits } from "ethers/lib/utils";
import { ReactComponent as ArrowsCross } from "assets/icons/arrows-cross.svg";
import { formatUSD } from "utils";
import { UnitType, useTokenInput, useAmplitude } from "hooks";
import { ampli } from "ampli";
import { ChangeAccountModal } from "../ChangeAccountModal";
import SelectorButton from "../ChainTokenSelector/SelectorButton";
import { BalanceSelector } from "../BalanceSelector";
import {
  TokenAmountInput,
  TokenAmountInputTitle,
  TokenAmountInputWrapper,
  TokenAmountStack,
  TokenInputWrapper,
  TokenSelectorColumn,
  UnitToggleButton,
  UnitToggleButtonWrapper,
} from "./styles";
import { useQuoteRequestContext } from "../../hooks/useQuoteRequest/QuoteRequestContext";
import { BigNumber } from "ethers";

type DestinationTokenDisplayProps = {
  expectedOutputAmount: BigNumber | undefined;
  isUpdateLoading: boolean;
  unit: UnitType;
  setUnit: (unit: UnitType) => void;
};

export const DestinationTokenDisplay = ({
  expectedOutputAmount,
  isUpdateLoading,
  unit,
  setUnit,
}: DestinationTokenDisplayProps) => {
  const {
    quoteRequest,
    setDestinationAmount,
    setOriginToken,
    setDestinationToken,
  } = useQuoteRequestContext();
  const { addToAmpliQueue } = useAmplitude();

  const shouldUpdate = quoteRequest.tradeType === "exactInput";

  const { destinationToken, originToken } = quoteRequest;

  const {
    amountString,
    convertedAmount,
    toggleUnit,
    handleInputChange,
    handleBalanceClick,
  } = useTokenInput({
    token: destinationToken,
    setAmount: setDestinationAmount,
    expectedAmount: expectedOutputAmount,
    shouldUpdate,
    isUpdateLoading,
    unit,
    setUnit,
  });

  const inputDisabled = (() => {
    if (!quoteRequest.destinationToken) return true;
    return Boolean(shouldUpdate && isUpdateLoading);
  })();

  const formattedConvertedAmount = (() => {
    if (unit === "token") {
      if (!convertedAmount) return "$0.00";
      return "$" + formatUSD(convertedAmount);
    }
    if (!convertedAmount) return "0.00";
    return `${formatUnits(convertedAmount, destinationToken?.decimals)} ${destinationToken?.symbol}`;
  })();

  return (
    <TokenInputWrapper>
      <TokenAmountStack>
        <TokenAmountInputTitle>
          To
          <ChangeAccountModal />
        </TokenAmountInputTitle>

        <TokenAmountInputWrapper
          showPrefix={unit === "usd"}
          value={amountString}
          error={false}
        >
          <TokenAmountInput
            id="destination-amount-input"
            name="destination-amount-input"
            placeholder="0.00"
            value={amountString}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={inputDisabled}
            error={false}
          />
        </TokenAmountInputWrapper>
        <UnitToggleButtonWrapper>
          <UnitToggleButton
            onClick={() => {
              addToAmpliQueue(() => {
                ampli.changeUnitsButtonClicked({
                  action: "onClick",
                  element: "changeUnitsButton",
                  page: "bridgePage",
                  section: "bridgeForm",
                });
              });
              toggleUnit();
            }}
          >
            <ArrowsCross width={16} height={16} />{" "}
            <span>{formattedConvertedAmount}</span>
          </UnitToggleButton>
        </UnitToggleButtonWrapper>
      </TokenAmountStack>
      <TokenSelectorColumn>
        <SelectorButton
          onSelect={setDestinationToken}
          onSelectOtherToken={setOriginToken}
          isOriginToken={false}
          marginBottom={destinationToken ? "24px" : "0px"}
          selectedToken={destinationToken}
          otherToken={originToken}
        />

        {destinationToken && (
          <BalanceSelector
            token={destinationToken}
            disableHover={true}
            error={false}
            setAmount={(amount) => {
              if (amount) {
                handleBalanceClick(amount, destinationToken.decimals);
              }
            }}
          />
        )}
      </TokenSelectorColumn>
    </TokenInputWrapper>
  );
};
