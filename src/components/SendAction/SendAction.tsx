import React from "react";
import {
  formatUnits,
  receiveAmount,
  getChainInfo,
  getToken,
  getConfirmationDepositTime,
} from "utils";
import { PrimaryButton } from "../Buttons";
import {
  Wrapper,
  Info,
  AccentSection,
  InfoHeadlineContainer,
  SlippageDisclaimer,
  FeesButton,
  InfoContainer,
  AmountToReceive,
  PendingTxWrapper,
} from "./SendAction.styles";

import InformationDialog from "components/InformationDialog";
import useSendAction from "./useSendAction";
import type { Deposit } from "views/Confirmation";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import { ReactComponent as ConfettiIcon } from "assets/confetti.svg";
import { ampli } from "../../ampli";
type Props = {
  onDeposit: (deposit: Deposit) => void;
};
const SendAction: React.FC<Props> = ({ onDeposit }) => {
  const {
    amount,
    fees,
    tokenSymbol,
    toChain,
    handleActionClick,
    buttonDisabled,
    isInfoModalOpen,
    toggleInfoModal,
    buttonMsg,
    txPending,
    fromChain,
    txHash,
    limits,
    limitsError,
  } = useSendAction(onDeposit);
  const showFees = amount.gt(0) && !!fees;
  const amountMinusFees = showFees ? receiveAmount(amount, fees) : undefined;
  const toChainInfo = toChain ? getChainInfo(toChain) : undefined;
  const fromChainInfo = fromChain ? getChainInfo(fromChain) : undefined;
  const tokenInfo = tokenSymbol ? getToken(tokenSymbol) : undefined;
  const isWETH = tokenInfo?.symbol === "WETH";
  let timeToRelay = "loading";
  if (limits && toChain && fromChain) {
    timeToRelay = getConfirmationDepositTime(
      amount,
      limits,
      toChain,
      fromChain
    );
  } else if (limitsError) {
    timeToRelay = "estimation failed";
  }

  return (
    <AccentSection>
      <Wrapper>
        {toChainInfo && fromChainInfo && tokenInfo && amount.gt(0) && (
          <div data-cy="fees-box">
            <InfoHeadlineContainer>
              <SlippageDisclaimer>
                <ConfettiIcon />
                All transfers are slippage free!
              </SlippageDisclaimer>
              <FeesButton
                onClick={() => {
                  ampli.feesInfoExpanded();
                  toggleInfoModal();
                }}
              >
                Fees info
              </FeesButton>
            </InfoHeadlineContainer>
            <InfoContainer>
              <Info>
                {`Time to ${toChainInfo.name}`}
                <div>{timeToRelay}</div>
              </Info>
              <Info>
                <div>Destination Gas Fee</div>
                <div>
                  {showFees
                    ? `${formatUnits(
                        fees.relayerGasFee.total,
                        tokenInfo.decimals
                      )} ${tokenInfo.symbol}`
                    : "loading"}
                </div>
              </Info>
              <Info>
                <div>Across Bridge Fee</div>
                <div>
                  {fees
                    ? `${formatUnits(
                        fees.lpFee.total.add(fees.relayerCapitalFee.total),
                        tokenInfo.decimals
                      )} ${tokenInfo.symbol}`
                    : "loading"}
                </div>
              </Info>
            </InfoContainer>
            <AmountToReceive>
              You will receive
              <span>
                {amountMinusFees
                  ? `${formatUnits(amountMinusFees, tokenInfo.decimals)} ${
                      isWETH ? "ETH" : tokenInfo.symbol
                    }`
                  : "loading"}
              </span>
            </AmountToReceive>
          </div>
        )}
        <PrimaryButton
          onClick={handleActionClick}
          disabled={buttonDisabled}
          data-cy="send"
        >
          {buttonMsg}
          {txPending && <BouncingDotsLoader />}
        </PrimaryButton>
        {txHash && fromChain ? (
          <PendingTxWrapper>
            <a
              href={getChainInfo(fromChain).constructExplorerLink(txHash)}
              target="_blank"
              rel="noreferrer"
            >
              Transaction Explorer
            </a>
          </PendingTxWrapper>
        ) : null}
      </Wrapper>
      <InformationDialog isOpen={isInfoModalOpen} onClose={toggleInfoModal} />
    </AccentSection>
  );
};

export default SendAction;
