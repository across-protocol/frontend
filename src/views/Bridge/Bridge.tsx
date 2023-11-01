import { useState } from "react";

import { LayoutV2, WrongNetworkHeader } from "components";
import { Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import BridgeForm from "./components/BridgeForm";
import ChangeAccountModal from "./components/ChangeAccountModal";
import DepositConfirmation from "./components/DepositConfirmation";
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
    amountToBridge,
    estimatedTimeString,
    toAccount,
    setCustomToAddress,
    trackingTxHash,
    transactionPending,
    handleClickNewTx,
    explorerUrl,
    transactionElapsedTimeAsFormattedString,
    isCurrentTokenMaxApyLoading,
    currentTokenMaxApy,
    handleChangeAmountInput,
    handleClickMaxBalance,
    handleSelectToken,
    handleSelectFromChain,
    handleSelectToChain,
    depositReferralReward,
    convertTokensToBaseCurrency,
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
          {trackingTxHash ? (
            <DepositConfirmation
              currentFromRoute={selectedRoute.fromChain}
              currentToRoute={selectedRoute.toChain}
              fees={fees}
              amountToBridge={amountToBridge}
              currentToken={selectedRoute.fromTokenSymbol}
              estimatedTime={estimatedTimeString}
              isConnected={isConnected}
              transactionPending={transactionPending}
              onClickNewTx={handleClickNewTx}
              explorerLink={explorerUrl}
              elapsedTimeFromDeposit={transactionElapsedTimeAsFormattedString}
              toAccount={toAccount}
              currentTokenMaxApy={currentTokenMaxApy}
              isCurrentTokenMaxApyLoading={isCurrentTokenMaxApyLoading}
              convertTokensToBaseCurrency={convertTokensToBaseCurrency}
              depositReferralReward={depositReferralReward}
            />
          ) : (
            <BridgeForm
              selectedRoute={selectedRoute}
              amountToBridge={amountToBridge}
              amountInput={userAmountInput}
              toAccount={toAccount}
              onChangeAmountInput={handleChangeAmountInput}
              onClickMaxBalance={handleClickMaxBalance}
              onSelectToken={handleSelectToken}
              onSelectFromChain={handleSelectFromChain}
              onSelectToChain={handleSelectToChain}
              onClickQuickSwap={handleQuickSwap}
              onClickChainSwitch={handleChainSwitch}
              onClickActionButton={buttonActionHandler}
              onClickChangeToAddress={() => setDisplayChangeAccount(true)}
              fees={fees}
              estimatedTimeString={estimatedTimeString}
              isConnected={isConnected}
              isWrongChain={isWrongChain}
              buttonLabel={buttonLabel}
              isBridgeDisabled={isBridgeDisabled}
              validationError={amountValidationError}
              balance={balance}
              convertTokensToBaseCurrency={convertTokensToBaseCurrency}
              depositReferralReward={depositReferralReward}
            />
          )}
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
