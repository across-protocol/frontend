import { useState } from "react";

import { LayoutV2 } from "components";
import { Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import BridgeForm from "./components/BridgeForm";
import ChangeAccountModal from "./components/ChangeAccountModal";
import { useBridge } from "./hooks/useBridge";
import { getEcosystem } from "utils";

const Bridge = () => {
  const [displayChangeAccount, setDisplayChangeAccount] = useState(false);

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
    handleChangeToAddressEVM,
    handleChangeToAddressSVM,
    handleChangeAmountInput,
    handleClickMaxBalance,
    handleSelectInputToken,
    handleSelectOutputToken,
    handleSelectFromChain,
    handleSelectToChain,
    handleSetNewSlippage,
    isQuoteLoading,
    showHyperliquidWarning,
  } = useBridge();

  const destinationChainEcosystem = getEcosystem(selectedRoute.toChain);

  return (
    <>
      <ChangeAccountModal
        displayModal={displayChangeAccount}
        onCloseModal={() => setDisplayChangeAccount(false)}
        currentAccountEVM={toAccountEVM?.address}
        currentAccountSVM={toAccountSVM?.address}
        onChangeAccountEVM={handleChangeToAddressEVM}
        onChangeAccountSVM={handleChangeToAddressSVM}
        destinationChainEcosystem={destinationChainEcosystem}
      />
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
            showHyperliquidWarning={showHyperliquidWarning}
          />
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
