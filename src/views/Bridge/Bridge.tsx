import { useState } from "react";

import { LayoutV2, WrongNetworkHeader } from "components";
import { Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import BridgeForm from "./components/BridgeForm";
import ChangeAccountModal from "./components/ChangeAccountModal";
import { useBridge } from "./hooks/useBridge";

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
    fees,
    balance,
    amountValidationError,
    userAmountInput,
    swapSlippage,
    parsedAmountInput,
    estimatedTimeString,
    swapQuote,
    toAccount,
    setCustomToAddress,
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
      <WrongNetworkHeader requiredChainId={selectedRoute.fromChain} />
      {toAccount && (
        <ChangeAccountModal
          displayModal={displayChangeAccount}
          displayModalCloseHandler={() => setDisplayChangeAccount(false)}
          currentAccount={toAccount?.address}
          changeAccountHandler={setCustomToAddress}
        />
      )}
      <LayoutV2 maxWidth={600}>
        <Wrapper>
          <Breadcrumb />
          <BridgeForm
            selectedRoute={selectedRoute}
            parsedAmountInput={parsedAmountInput}
            amountInput={userAmountInput}
            swapSlippage={swapSlippage}
            toAccount={toAccount}
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
            fees={fees}
            estimatedTimeString={estimatedTimeString}
            isConnected={isConnected}
            isWrongChain={isWrongChain}
            buttonLabel={buttonLabel}
            isBridgeDisabled={isBridgeDisabled}
            validationError={amountValidationError}
            balance={balance}
            isQuoteLoading={isQuoteLoading}
            swapQuote={swapQuote}
          />
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
