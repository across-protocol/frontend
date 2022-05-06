import React from "react";
import { formatUnits, receiveAmount, getChainInfo, getToken } from "utils";
import { PrimaryButton } from "../Buttons";
import {
  Wrapper,
  Info,
  AccentSection,
  InfoIcon,
  InfoWrapper,
} from "./SendAction.styles";

import InformationDialog from "components/InformationDialog";
import useSendAction from "./useSendAction";
import type { Deposit } from "views/Confirmation";
import BouncingDotsLoader from "components/BouncingDotsLoader";

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
  } = useSendAction(onDeposit);
  const showFees = amount.gt(0) && !!fees;
  const amountMinusFees = showFees ? receiveAmount(amount, fees) : undefined;
  const toChainInfo = toChain ? getChainInfo(toChain) : undefined;
  const tokenInfo = tokenSymbol ? getToken(tokenSymbol) : undefined;

  return (
    <AccentSection>
      <Wrapper>
        {toChainInfo && tokenInfo && (
          <InfoWrapper animate={{ opacity: showFees ? 1 : 0 }}>
            <Info>
              <div>Time to {toChainInfo.name}</div>
              <div>~1-3 minutes</div>
            </Info>
            <Info>
              <div>{toChainInfo.name} Gas Fee</div>
              {showFees && (
                <div>
                  {formatUnits(fees.relayerFee.total, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </div>
              )}
            </Info>
            <Info>
              <div>Bridge Fee</div>
              {showFees && (
                <div>
                  {`${formatUnits(fees.lpFee.total, tokenInfo.decimals)}
                    ${tokenInfo.symbol}`}
                </div>
              )}
            </Info>
            <Info>
              <div>You will receive</div>
              {showFees && amountMinusFees && (
                <div>
                  {formatUnits(amountMinusFees, tokenInfo.decimals)}{" "}
                  {tokenInfo.symbol}
                </div>
              )}
            </Info>
            <InfoIcon aria-label="info dialog" onClick={toggleInfoModal} />
          </InfoWrapper>
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
