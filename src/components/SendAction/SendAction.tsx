import React from "react";
import { CHAINS, formatUnits, getEstimatedDepositTime, ChainId } from "utils";
import { PrimaryButton } from "../Buttons";
import {
  Wrapper,
  Info,
  AccentSection,
  InfoIcon,
  L1Info,
  InfoWrapper,
} from "./SendAction.styles";

import InformationDialog from "components/InformationDialog";
import useSendAction from "./useSendAction";

const SendAction: React.FC = () => {
  const {
    amount,
    fees,
    tokenInfo,
    toChain,
    fromChain,
    amountMinusFees,
    isWETH,
    handleClick,
    buttonDisabled,
    isInfoModalOpen,
    toggleInfoModal,
    buttonMsg,
  } = useSendAction();

  const showFees = amount.gt(0) && fees && tokenInfo;
  return (
    <AccentSection>
      <Wrapper>
        <InfoWrapper animate={{ opacity: showFees ? 1 : 0 }}>
          <Info>
            <div>Time to {CHAINS[toChain].name}</div>
            <div>{getEstimatedDepositTime(toChain)}</div>
          </Info>
          {fromChain !== ChainId.MAINNET && (
            <Info>
              <div>Ethereum Gas Fee</div>
              {showFees && (
                <div>
                  {formatUnits(
                    fees.instantRelayFee.total.add(fees.slowRelayFee.total),
                    tokenInfo.decimals
                  )}{" "}
                  {tokenInfo.symbol}
                </div>
              )}
            </Info>
          )}
          <Info>
            <div>
              {fromChain === ChainId.MAINNET
                ? "Native Bridge Fee"
                : "Bridge Fee"}
            </div>
            {showFees && (
              <div>
                {fromChain === ChainId.MAINNET
                  ? "Free"
                  : `${formatUnits(fees.lpFee.total, tokenInfo.decimals)}
                  ${tokenInfo.symbol}`}
              </div>
            )}
          </Info>
          <Info>
            <div>You will receive</div>
            {showFees && (
              <div>
                {formatUnits(amountMinusFees, tokenInfo.decimals)}{" "}
                {isWETH ? "ETH" : tokenInfo.symbol}
              </div>
            )}
          </Info>
          <InfoIcon aria-label="info dialog" onClick={toggleInfoModal} />
        </InfoWrapper>
        <PrimaryButton onClick={handleClick} disabled={buttonDisabled}>
          {buttonMsg}
        </PrimaryButton>
        {fromChain === ChainId.MAINNET && (
          <L1Info>
            <div>L1 to L2 transfers use the destination’s native bridge</div>
          </L1Info>
        )}
      </Wrapper>
      <InformationDialog isOpen={isInfoModalOpen} onClose={toggleInfoModal} />
    </AccentSection>
  );
};

export default SendAction;
