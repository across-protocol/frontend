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
} from "./SendAction.styles";

import InformationDialog from "components/InformationDialog";
import useSendAction from "./useSendAction";
import type { Deposit } from "views/Confirmation";
import BouncingDotsLoader from "components/BouncingDotsLoader";
import { ReactComponent as ConfettiIcon } from "assets/confetti.svg";

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
  } = useSendAction(onDeposit);
  const showFees = amount.gt(0) && !!fees;
  const amountMinusFees = showFees ? receiveAmount(amount, fees) : undefined;
  const toChainInfo = toChain ? getChainInfo(toChain) : undefined;
  const fromChainInfo = fromChain ? getChainInfo(fromChain) : undefined;
  const tokenInfo = tokenSymbol ? getToken(tokenSymbol) : undefined;
  const isWETH = tokenInfo?.symbol === "WETH";

  console.log({
    amount: amount?.toString(),
    lpFee: fees?.lpFee?.total?.toString(),
    relayerFee: fees?.relayerFee?.total?.toString(),
    amountMinusFees: amountMinusFees?.toString(),
  });

  return (
    <AccentSection>
      <Wrapper>
        {toChainInfo && fromChainInfo && tokenInfo && amount.gt(0) && (
          <>
            <InfoHeadlineContainer>
              <SlippageDisclaimer>
                <ConfettiIcon />
                All transfers are slippage free!
              </SlippageDisclaimer>
              <FeesButton onClick={toggleInfoModal}>Fees info</FeesButton>
            </InfoHeadlineContainer>
            <InfoContainer>
              <Info>
                {`Time to ${toChainInfo.name}`}
                <div>{getConfirmationDepositTime()}</div>
              </Info>
              <Info>
                <div>Ethereum Network Gas</div>
                <div>
                  {showFees
                    ? `${formatUnits(
                        fees.relayerFee.total,
                        tokenInfo.decimals
                      )} ${tokenInfo.symbol}`
                    : "loading"}
                </div>
              </Info>
              <Info>
                <div>Across Bridge Fee</div>
                <div>
                  {fees
                    ? `${formatUnits(fees.lpFee.total, tokenInfo.decimals)} ${
                        tokenInfo.symbol
                      }`
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
          </>
        )}
        <PrimaryButton onClick={handleActionClick} disabled={buttonDisabled}>
          {buttonMsg}
          {txPending && <BouncingDotsLoader />}
        </PrimaryButton>
      </Wrapper>
      <InformationDialog isOpen={isInfoModalOpen} onClose={toggleInfoModal} />
    </AccentSection>
  );
};

export default SendAction;
