import { useState } from "react";

import { LayoutV2 } from "components";
import { Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import BridgeForm from "./components/BridgeForm";
import { useBridge } from "./hooks/useBridge";

const Bridge = () => {
  const [_, setDisplayChangeAccount] = useState(false);

  const {
    selectedRoute,
    handleQuickSwap,
    isConnected,
    isWrongChain,
    handleChainSwitch,
    buttonActionHandler,
    buttonLabel,
    isBridgeDisabled,
    limits,
    fees,
    balance,
    amountValidationError,
    amountValidationWarning,
    userAmountInput,
    swapSlippage,
    parsedAmountInput,
    estimatedTimeString,
    swapQuote,
    universalSwapQuote,
    toAccountEVM,
    toAccountSVM,
    handleChangeAmountInput,
    handleClickMaxBalance,
    handleSelectInputToken,
    handleSelectOutputToken,
    handleSelectFromChain,
    handleSelectToChain,
    handleSetNewSlippage,
    isQuoteLoading,
  } = useBridge();

  return (
    <>
      <LayoutV2 maxWidth={600}>
        <Wrapper>
          <Breadcrumb />
          <BridgeForm
            selectedRoute={selectedRoute}
            parsedAmountInput={parsedAmountInput}
            amountInput={userAmountInput}
            swapSlippage={swapSlippage}
            toAccountEVM={toAccountEVM}
            toAccountSVM={toAccountSVM}
            onChangeAmountInput={handleChangeAmountInput}
            onClickMaxBalance={handleClickMaxBalance}
            onSelectInputToken={handleSelectInputToken}
            onSelectOutputToken={handleSelectOutputToken}
            onSelectFromChain={handleSelectFromChain}
            onSelectToChain={handleSelectToChain}
            onClickQuickSwap={handleQuickSwap}
            onClickChainSwitch={handleChainSwitch}
            onClickActionButton={buttonActionHandler}
            onClickChangeToAddress={() => setDisplayChangeAccount(true)}
            onSetNewSlippage={handleSetNewSlippage}
            limits={limits}
            fees={fees}
            estimatedTimeString={estimatedTimeString}
            isConnected={isConnected}
            isWrongChain={isWrongChain}
            buttonLabel={buttonLabel}
            isBridgeDisabled={isBridgeDisabled}
            validationError={amountValidationError}
            validationWarning={amountValidationWarning}
            balance={balance}
            isQuoteLoading={isQuoteLoading}
            swapQuote={swapQuote}
            universalSwapQuote={universalSwapQuote}
          />
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
