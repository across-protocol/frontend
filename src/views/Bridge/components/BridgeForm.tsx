import { BigNumber } from "ethers";
import styled from "@emotion/styled";

import ExternalCardWrapper from "components/CardWrapper";
import { PrimaryButton } from "components/Button";
import { Text } from "components";

import EstimatedTable from "./EstimatedTable";
import QuickSwap from "./QuickSwap";
import SlippageAlert from "./SlippageAlert";
import { AmountInput } from "./AmountInput";
import { TokenSelector } from "./TokenSelector";
import { ChainSelector } from "./ChainSelector";

import {
  getToken,
  GetBridgeFeesResult,
  QUERIESV2,
  receiveAmount,
  Route,
} from "utils";
import { VoidHandler } from "utils/types";

import { AmountInputError, getReceiveTokenSymbol } from "../utils";
import { ToAccount } from "../hooks/useToAccount";

type BridgeFormProps = {
  selectedRoute: Route;
  amountInput: string;
  amountToBridge?: BigNumber;
  toAccount?: ToAccount;

  onChangeAmountInput: (input: string) => void;
  onClickMaxBalance: VoidHandler;
  onSelectToken: (token: string) => void;
  onSelectFromChain: (chainId: number) => void;
  onSelectToChain: (chainId: number) => void;
  onClickQuickSwap: VoidHandler;
  onClickChainSwitch: VoidHandler;
  onClickActionButton: VoidHandler;
  onClickChangeToAddress: VoidHandler;

  fees?: GetBridgeFeesResult;
  estimatedTimeString?: string;
  balance?: BigNumber;

  isConnected: boolean;
  isWrongChain: boolean;
  buttonLabel: string;
  isBridgeDisabled: boolean;
  validationError?: AmountInputError;
};

const BridgeForm = ({
  selectedRoute,
  amountToBridge,
  amountInput,
  toAccount,

  onClickMaxBalance,
  onChangeAmountInput,
  onSelectToken,
  onSelectFromChain,
  onSelectToChain,
  onClickQuickSwap,
  onClickChainSwitch,
  onClickActionButton,
  onClickChangeToAddress,

  fees,
  estimatedTimeString,
  balance,

  isConnected,
  isWrongChain,
  buttonLabel,
  isBridgeDisabled,
  validationError,
}: BridgeFormProps) => {
  return (
    <>
      <CardWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            Send
          </Text>
          <SendWrapper>
            <AmountInput
              amountInput={amountInput}
              parsedAmountInput={amountToBridge}
              selectedRoute={selectedRoute}
              onChangeAmountInput={onChangeAmountInput}
              onClickMaxBalance={onClickMaxBalance}
              validationError={validationError}
              balance={balance}
            />
            <TokenSelector
              selectedRoute={selectedRoute}
              onSelectToken={onSelectToken}
            />
          </SendWrapper>
        </RowWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            From
          </Text>
          <ChainSelector
            selectedRoute={selectedRoute}
            fromOrTo="from"
            onSelectChain={onSelectFromChain}
          />
        </RowWrapper>
        <RowWrapper>
          <PaddedText size="md" color="grey-400">
            To
          </PaddedText>
          <QuickSwapWrapper>
            <QuickSwap onQuickSwap={onClickQuickSwap} />
          </QuickSwapWrapper>
          <FromSelectionStack>
            <ChainSelector
              selectedRoute={selectedRoute}
              fromOrTo="to"
              onSelectChain={onSelectToChain}
              toAddress={toAccount?.address}
            />
            <ChangeAddressLink
              size="sm"
              color="grey-400"
              onClick={onClickChangeToAddress}
            >
              Change account
            </ChangeAddressLink>
          </FromSelectionStack>
        </RowWrapper>
      </CardWrapper>
      <CardWrapper>
        <SlippageAlert />
        <EstimatedTable
          fromChainId={selectedRoute.fromChain}
          toChainId={selectedRoute.toChain}
          estimatedTime={estimatedTimeString}
          gasFee={fees?.relayerGasFee.total}
          bridgeFee={
            fees && amountToBridge && amountToBridge.gt(0)
              ? receiveAmount(amountToBridge, fees).deductionsSansRelayerGas
              : undefined
          }
          totalReceived={
            fees && amountToBridge && amountToBridge.gt(0)
              ? receiveAmount(amountToBridge, fees).receivable
              : undefined
          }
          token={getToken(selectedRoute.fromTokenSymbol)}
          receiveToken={getToken(
            getReceiveTokenSymbol(
              selectedRoute.toChain,
              selectedRoute.fromTokenSymbol,
              Boolean(toAccount?.isContract)
            )
          )}
        />
        {isWrongChain ? (
          <Button onClick={onClickChainSwitch}>Switch Network</Button>
        ) : (
          <Button
            disabled={isBridgeDisabled}
            onClick={onClickActionButton}
            data-cy={!isConnected ? "connect-wallet" : "bridge-button"}
          >
            {buttonLabel}
          </Button>
        )}
      </CardWrapper>{" "}
    </>
  );
};

export default BridgeForm;

const CardWrapper = styled(ExternalCardWrapper)`
  width: 100%;
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;

  width: 100%;

  position: relative;
`;

const SendWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
  width: 100%;

  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
`;

const QuickSwapWrapper = styled.div`
  height: fit-content;
  width: fit-content;
  position: absolute;
  left: calc(50% - 20px);
  top: -25px;
  @media ${QUERIESV2.sm.andDown} {
    top: -16px;
  }
`;

const PaddedText = styled(Text)`
  @media ${QUERIESV2.sm.andDown} {
    padding-top: 12px;
  }
`;

const FromSelectionStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
`;

const ChangeAddressLink = styled(Text)`
  cursor: pointer;
`;

const Button = styled(PrimaryButton)`
  width: 100%;
`;
