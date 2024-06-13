import { BigNumber } from "ethers";
import styled from "@emotion/styled";
import { Clock } from "react-feather";

import ExternalCardWrapper from "components/CardWrapper";
import { PrimaryButton, SecondaryButton } from "components/Button";
import { Text } from "components";
import { InputErrorText } from "components/AmountInput";

import QuickSwap from "./QuickSwap";
import { AmountInput } from "./AmountInput";
import { TokenSelector } from "./TokenSelector";
import { ChainSelector } from "./ChainSelector";
import RewardsProgramCTA from "./RewardsProgramCTA";
import { FeesCollapsible } from "./FeesCollapsible";
import { RecipientRow } from "./RecipientRow";

import {
  getToken,
  GetBridgeFeesResult,
  QUERIESV2,
  chainIdToRewardsProgramName,
} from "utils";
import { VoidHandler } from "utils/types";

import {
  AmountInputError,
  SelectedRoute,
  getReceiveTokenSymbol,
} from "../utils";
import { ToAccount } from "../hooks/useToAccount";
import { useConnection } from "hooks";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";

export type BridgeFormProps = {
  selectedRoute: SelectedRoute;
  amountInput: string;
  swapSlippage: number;
  parsedAmountInput?: BigNumber;
  toAccount?: ToAccount;

  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: VoidHandler;
  onSelectInputToken: (token: string) => void;
  onSelectOutputToken: (token: string) => void;
  onSelectFromChain: (chainId: number) => void;
  onSelectToChain: (chainId: number) => void;
  onClickQuickSwap: VoidHandler;
  onClickChainSwitch: VoidHandler;
  onClickActionButton: VoidHandler;
  onClickChangeToAddress: VoidHandler;
  onSetNewSlippage: (slippage: number) => void;

  fees?: GetBridgeFeesResult;
  estimatedTimeString?: string;
  balance?: BigNumber;
  swapQuote?: SwapQuoteApiResponse;

  isConnected: boolean;
  isWrongChain: boolean;
  buttonLabel: string;
  isBridgeDisabled: boolean;
  validationError?: AmountInputError;
  isQuoteLoading: boolean;
};

const validationErrorTextMap = {
  [AmountInputError.INSUFFICIENT_BALANCE]:
    "Insufficient balance to process this transfer.",
  [AmountInputError.INSUFFICIENT_LIQUIDITY]:
    "Insufficient bridge liquidity to process this transfer.",
  [AmountInputError.INVALID]: "Only positive numbers are allowed as an input.",
  [AmountInputError.AMOUNT_TOO_LOW]:
    "The amount you are trying to bridge is too low.",
};

const BridgeForm = ({
  selectedRoute,
  parsedAmountInput,
  amountInput,
  toAccount,
  swapSlippage,

  onClickMaxBalance,
  onChangeAmountInput,
  onSelectInputToken,
  onSelectOutputToken,
  onSelectFromChain,
  onSelectToChain,
  onClickQuickSwap,
  onClickChainSwitch,
  onClickActionButton,
  onClickChangeToAddress,
  onSetNewSlippage,

  fees,
  estimatedTimeString,
  balance,
  swapQuote,

  isConnected,
  isWrongChain,
  buttonLabel,
  isBridgeDisabled,
  validationError,
  isQuoteLoading,
}: BridgeFormProps) => {
  const programName = chainIdToRewardsProgramName[selectedRoute.toChain];
  const { connect } = useConnection();

  const receiveTokenSymbol = getReceiveTokenSymbol(
    selectedRoute.toChain,
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    Boolean(toAccount?.isContract)
  );

  return (
    <CardWrapper>
      {programName && <RewardsProgramCTA program={programName} />}
      <RowWrapper>
        <RowLabelWrapper>
          <Text size="md" color="grey-400">
            Send
          </Text>
        </RowLabelWrapper>
        <InputWrapper>
          <AmountInput
            amountInput={amountInput}
            selectedRoute={selectedRoute}
            onChangeAmountInput={onChangeAmountInput}
            onClickMaxBalance={onClickMaxBalance}
            validationError={parsedAmountInput ? validationError : undefined}
            balance={balance}
          />
        </InputWrapper>
        <TokenSelectorWrapper>
          <TokenSelector
            selectedRoute={selectedRoute}
            onSelectToken={onSelectInputToken}
            inputOrOutputToken="input"
          />
        </TokenSelectorWrapper>
      </RowWrapper>
      {parsedAmountInput && validationError && (
        <InputErrorText errorText={validationErrorTextMap[validationError]} />
      )}
      <RowWrapper>
        <RowLabelWrapper>
          <Text size="md" color="grey-400">
            From
          </Text>
        </RowLabelWrapper>
        <ChainSelector
          selectedRoute={selectedRoute}
          fromOrTo="from"
          onSelectChain={onSelectFromChain}
        />
      </RowWrapper>
      <FillTimeRowWrapper>
        <QuickSwapRowLabelWrapper>
          <QuickSwap onQuickSwap={onClickQuickSwap} />
        </QuickSwapRowLabelWrapper>
        <Divider />
        <FillTimeWrapper>
          <Clock color="#9DAAB3" size="16" />
          <Text size="md" color="grey-400">
            {estimatedTimeString || ""}
          </Text>
        </FillTimeWrapper>
        <QuickSwapWrapperMobile>
          <QuickSwap onQuickSwap={onClickQuickSwap} />
        </QuickSwapWrapperMobile>
        <Divider />
      </FillTimeRowWrapper>
      <RowWrapper>
        <RowLabelWrapper>
          <Text size="md" color="grey-400">
            To
          </Text>
        </RowLabelWrapper>
        <ChainSelector
          selectedRoute={selectedRoute}
          fromOrTo="to"
          onSelectChain={onSelectToChain}
        />
        <TokenSelectorWrapper>
          <TokenSelector
            selectedRoute={selectedRoute}
            onSelectToken={onSelectOutputToken}
            inputOrOutputToken="output"
            receiveTokenSymbol={receiveTokenSymbol}
          />
        </TokenSelectorWrapper>
      </RowWrapper>
      {toAccount && (
        <RowWrapper>
          <RecipientRow
            onClickChangeToAddress={onClickChangeToAddress}
            recipient={toAccount}
          />
        </RowWrapper>
      )}
      <FeesCollapsible
        isQuoteLoading={isQuoteLoading}
        fromChainId={selectedRoute.fromChain}
        toChainId={selectedRoute.toChain}
        isSwap={selectedRoute.type === "swap"}
        estimatedTime={estimatedTimeString}
        gasFee={fees?.relayerGasFee.total}
        capitalFee={fees?.relayerCapitalFee.total}
        lpFee={fees?.lpFee.total}
        parsedAmount={parsedAmountInput}
        swapQuote={swapQuote}
        inputToken={getToken(selectedRoute.fromTokenSymbol)}
        outputToken={getToken(receiveTokenSymbol)}
        swapToken={
          selectedRoute.type === "swap"
            ? getToken(selectedRoute.swapTokenSymbol)
            : undefined
        }
        onSetNewSlippage={onSetNewSlippage}
        currentSwapSlippage={swapSlippage}
        validationError={validationError}
      />
      {isWrongChain ? (
        <StyledSecondaryButton onClick={onClickChainSwitch}>
          Switch Network
        </StyledSecondaryButton>
      ) : !isConnected ? (
        <StyledSecondaryButton
          onClick={() => connect()}
          data-cy="connect-wallet"
        >
          Connect Wallet
        </StyledSecondaryButton>
      ) : (
        <Button
          disabled={isBridgeDisabled}
          onClick={onClickActionButton}
          data-cy={!isConnected ? "connect-wallet" : "bridge-button"}
        >
          {buttonLabel}
        </Button>
      )}
    </CardWrapper>
  );
};

export default BridgeForm;

const CardWrapper = styled(ExternalCardWrapper)`
  width: 100%;
`;

const RowLabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 64px;
  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
    justify-content: flex-start;
  }
`;

const QuickSwapRowLabelWrapper = styled(RowLabelWrapper)`
  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FillTimeRowWrapper = styled(RowWrapper)`
  @media ${QUERIESV2.sm.andDown} {
    flex-direction: row;
    align-items: center;
  }
`;

const QuickSwapWrapperMobile = styled.div`
  display: none;

  @media ${QUERIESV2.sm.andDown} {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
`;

const InputWrapper = styled.div`
  flex: 1;

  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
  }
`;

const TokenSelectorWrapper = styled.div`
  flex-shrink: 1;

  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
  }
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: #3f4047;
`;

const FillTimeWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const Button = styled(PrimaryButton)`
  width: 100%;
`;

const StyledSecondaryButton = styled(SecondaryButton)`
  width: 100%;
`;
