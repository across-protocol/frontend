import { LayoutV2, WrongNetworkHeader } from "components";
import { Wrapper } from "./Bridge.styles";
import Breadcrumb from "./components/Breadcrumb";
import BridgeForm from "./components/BridgeForm";
import ChangeAccountModal from "./components/ChangeAccountModal";
import DepositConfirmation from "./components/DepositConfirmation";
import { useBridge } from "./hooks/useBridge";

const Bridge = () => {
  const {
    availableTokens,
    currentToken,
    setCurrentToken,
    setAmountToBridge,
    currentBalance,
    currentFromRoute,
    setCurrentFromRoute,
    availableFromRoutes,
    availableToRoutes,
    currentToRoute,
    setCurrentToRoute,
    handleQuickSwap,
    isConnected,
    isWrongChain,
    handleChainSwitch,
    buttonActionHandler,
    buttonLabel,
    isBridgeDisabled,
    fees,
    amountToBridge,
    estimatedTime,
    displayChangeAccount,
    setDisplayChangeAccount,
    toAccount,
    setToAccount,
    trackingTxHash,
    transactionPending,
    onTxHashChange,
    explorerUrl,
    transactionElapsedTimeAsFormattedString,
    amountTooLow,
    walletAccount,
    disableQuickSwap,
    setIsBridgeAmountValid,
    allFromRoutes,
    allToRoutes,
    isAmountGtMaxDeposit,
  } = useBridge();
  return (
    <>
      {currentFromRoute && (
        <WrongNetworkHeader requiredChainId={currentFromRoute} />
      )}
      {toAccount && (
        <ChangeAccountModal
          displayModal={displayChangeAccount}
          displayModalCloseHandler={() => setDisplayChangeAccount(false)}
          currentAccount={toAccount}
          changeAccountHandler={setToAccount}
        />
      )}
      <LayoutV2 maxWidth={600}>
        <Wrapper>
          <Breadcrumb />
          {trackingTxHash ? (
            <DepositConfirmation
              currentFromRoute={currentFromRoute}
              currentToRoute={currentToRoute}
              fees={fees}
              amountToBridge={amountToBridge}
              currentToken={currentToken}
              estimatedTime={estimatedTime}
              isConnected={isConnected}
              transactionPending={transactionPending}
              onTxHashChange={onTxHashChange}
              explorerLink={explorerUrl}
              elapsedTimeFromDeposit={transactionElapsedTimeAsFormattedString}
            />
          ) : (
            <BridgeForm
              availableTokens={availableTokens}
              currentToken={currentToken}
              setCurrentToken={setCurrentToken}
              setAmountToBridge={setAmountToBridge}
              currentBalance={currentBalance}
              currentFromRoute={currentFromRoute}
              setCurrentFromRoute={setCurrentFromRoute}
              availableFromRoutes={availableFromRoutes}
              allFromRoutes={allFromRoutes}
              availableToRoutes={availableToRoutes}
              allToRoutes={allToRoutes}
              currentToRoute={currentToRoute}
              setCurrentToRoute={setCurrentToRoute}
              handleQuickSwap={handleQuickSwap}
              isWrongChain={isWrongChain}
              handleChainSwitch={handleChainSwitch}
              isConnected={isConnected}
              buttonActionHandler={buttonActionHandler}
              buttonLabel={buttonLabel}
              isBridgeDisabled={isBridgeDisabled}
              fees={fees}
              amountToBridge={amountToBridge}
              estimatedTime={estimatedTime}
              displayChangeAccount={displayChangeAccount}
              setDisplayChangeAccount={setDisplayChangeAccount}
              toAccount={toAccount}
              amountTooLow={amountTooLow}
              walletAccount={walletAccount}
              disableQuickSwap={disableQuickSwap}
              setIsBridgeAmountValid={setIsBridgeAmountValid}
              isAmountGtMaxDeposit={isAmountGtMaxDeposit}
            />
          )}
        </Wrapper>
      </LayoutV2>
    </>
  );
};

export default Bridge;
