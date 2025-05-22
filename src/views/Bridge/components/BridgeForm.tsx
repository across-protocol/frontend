import { BigNumber, utils } from "ethers";
import styled from "@emotion/styled";
import { Clock, Info } from "react-feather";

import ExternalCardWrapper from "components/CardWrapper";
import { PrimaryButton, SecondaryButton } from "components/Button";
import { Alert, Text } from "components";

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
  formatWeiPct,
  rewardProgramsAvailable,
  COLORS,
} from "utils";
import { VoidHandler } from "utils/types";

import {
  AmountInputError,
  SelectedRoute,
  calcSwapPriceImpact,
  getReceiveTokenSymbol,
} from "../utils";
import { ToAccount } from "../hooks/useToAccount";
import { BridgeLimits, useConnection } from "hooks";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { Tooltip } from "components/Tooltip";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";

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
  onSelectFromChain: (chainId: number, externalProjectId?: string) => void;
  onSelectToChain: (chainId: number, externalProjectId?: string) => void;
  onClickQuickSwap: VoidHandler;
  onClickChainSwitch: VoidHandler;
  onClickActionButton: VoidHandler;
  onClickChangeToAddress: VoidHandler;
  onSetNewSlippage: (slippage: number) => void;

  limits?: BridgeLimits;
  fees?: GetBridgeFeesResult;
  estimatedTimeString?: string;
  balance?: BigNumber;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
  isConnected: boolean;
  isWrongChain: boolean;
  buttonLabel: string;
  isBridgeDisabled: boolean;
  validationError?: AmountInputError;
  validationWarning?: AmountInputError;
  isQuoteLoading: boolean;
};

// If swap price impact is lower than this threshold, show a warning
// Should be a negative percentage, e.g. -0.1 for -10%
const negativePriceImpactWarningThreshold = -0.01;

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
  onClickActionButton,
  onClickChangeToAddress,
  onSetNewSlippage,

  limits,
  fees,
  estimatedTimeString,
  balance,
  swapQuote,
  universalSwapQuote,

  isConnected,
  buttonLabel,
  isBridgeDisabled,
  validationError,
  validationWarning,
  isQuoteLoading,
}: BridgeFormProps) => {
  const programName = chainIdToRewardsProgramName[selectedRoute.toChain];
  const { connect } = useConnection();

  const receiveTokenSymbol = getReceiveTokenSymbol(
    selectedRoute.toChain,
    selectedRoute.fromTokenSymbol,
    selectedRoute.toTokenSymbol,
    Boolean(toAccount?.isContract),
    selectedRoute.type
  );

  const swapPriceImpact =
    selectedRoute.type === "swap" &&
    parsedAmountInput &&
    swapQuote?.minExpectedInputTokenAmount
      ? calcSwapPriceImpact(
          parsedAmountInput,
          swapQuote.minExpectedInputTokenAmount
        )
      : BigNumber.from(0);
  const showPriceImpactWarning =
    !isQuoteLoading &&
    utils
      .parseEther(String(negativePriceImpactWarningThreshold))
      .gt(swapPriceImpact);

  return (
    <CardWrapper>
      {programName && rewardProgramsAvailable.includes(programName) && (
        <RewardsProgramCTA
          toChain={selectedRoute.toChain}
          program={programName}
        />
      )}
      <AmountRowWrapper>
        <AmountRowLabelWrapper>
          <Text size="md" color="grey-400">
            Send
          </Text>
        </AmountRowLabelWrapper>
        <InputWrapper>
          <AmountInput
            amountInput={amountInput}
            selectedRoute={selectedRoute}
            onChangeAmountInput={onChangeAmountInput}
            onClickMaxBalance={onClickMaxBalance}
            validationError={parsedAmountInput ? validationError : undefined}
            validationWarning={
              parsedAmountInput ? validationWarning : undefined
            }
            balance={balance}
            limits={limits}
          />
        </InputWrapper>
        <TokenSelectorWrapper>
          <TokenSelector
            selectedRoute={selectedRoute}
            onSelectToken={onSelectInputToken}
            inputOrOutputToken="input"
          />
        </TokenSelectorWrapper>
      </AmountRowWrapper>
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
        <FillTimeRowUnderlay>
          <Divider />
        </FillTimeRowUnderlay>
        <QuickSwapRowLabelWrapper>
          <QuickSwap onQuickSwap={onClickQuickSwap} />
        </QuickSwapRowLabelWrapper>
        <Spacer />
        <FillTimeWrapper>
          <Clock color="#9DAAB3" size="16" />
          {estimatedTimeString && (
            <Text size="md" color="grey-400">
              {estimatedTimeString}
            </Text>
          )}
        </FillTimeWrapper>
        <QuickSwapWrapperMobile>
          <QuickSwap onQuickSwap={onClickQuickSwap} />
        </QuickSwapWrapperMobile>
        <Spacer />
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
      {toAccount && selectedRoute.externalProjectId !== "hyperliquid" && (
        <RowWrapper>
          <RecipientRow
            onClickChangeToAddress={onClickChangeToAddress}
            recipient={toAccount}
          />
        </RowWrapper>
      )}
      {showPriceImpactWarning && (
        <Tooltip
          tooltipId="price-impact-warning"
          anchorWidth="100%"
          maxWidth={384}
          placement="bottom-end"
          body={
            <PriceImpactTooltipBody>
              <div>
                <Info color="#f96c6c" />
              </div>
              <Text size="sm" color="light-300">
                This bridge transaction requires you to perform a swap on the
                origin chain. Depending on the current liquidity in the pool
                there may be a large difference between the input and output
                amount.
              </Text>
            </PriceImpactTooltipBody>
          }
        >
          <Alert status="danger" alignIcon="center">
            <PriceImpactTextContainer>
              <Text color="white">Price impact warning</Text>
              <Text color="red">{formatWeiPct(swapPriceImpact, 5)}%</Text>
            </PriceImpactTextContainer>
          </Alert>
        </Tooltip>
      )}
      <FeesCollapsible
        isQuoteLoading={isQuoteLoading}
        fromChainId={selectedRoute.fromChain}
        toChainId={selectedRoute.toChain}
        isSwap={selectedRoute.type === "swap"}
        isUniversalSwap={selectedRoute.type === "universal-swap"}
        quotedLimits={limits}
        gasFee={fees?.relayerGasFee.total}
        capitalFee={fees?.relayerCapitalFee.total}
        lpFee={fees?.lpFee.total}
        parsedAmount={parsedAmountInput}
        swapQuote={swapQuote}
        universalSwapQuote={universalSwapQuote}
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
        showPriceImpactWarning={showPriceImpactWarning}
        swapPriceImpact={swapPriceImpact}
        estimatedFillTimeSec={fees?.estimatedFillTimeSec}
      />
      {!isConnected ? (
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

const AmountRowLabelWrapper = styled(RowLabelWrapper)`
  padding-top: 12px;
`;

const QuickSwapRowLabelWrapper = styled(RowLabelWrapper)`
  z-index: 1;
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
  position: relative;
  @media ${QUERIESV2.sm.andDown} {
    gap: 0px;
    flex-direction: row;
    align-items: center;
  }
`;

const AmountRowWrapper = styled(RowWrapper)`
  align-items: start;
`;

const QuickSwapWrapperMobile = styled.div`
  display: none;

  background-color: ${COLORS["black-700"]};
  padding-right: 12px;

  @media ${QUERIESV2.sm.andDown} {
    z-index: 1;
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
  background-image: radial-gradient(circle, #3f4047 0%, #3f404700 100%);
`;

const Spacer = styled.div`
  height: 1px;
  width: 100%;
`;

const FillTimeRowUnderlay = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 0;
  width: 100%;
`;

const FillTimeWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  background: ${() => COLORS["black-700"]};
  padding: 0px 12px;
  z-index: 1;
`;

const Button = styled(PrimaryButton)`
  width: 100%;
`;

const StyledSecondaryButton = styled(SecondaryButton)`
  width: 100%;
`;

const PriceImpactTextContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const PriceImpactTooltipBody = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;

  svg {
    margin-top: 4px;
    height: 16px;
    width: 16px;
  }
`;
