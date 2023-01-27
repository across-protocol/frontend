import styled from "@emotion/styled";
import ExternalCardWrapper from "components/CardWrapper";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { Selector, Text } from "components";
import {
  ChainInfo,
  capitalizeFirstLetter,
  shortenAddress,
  receiveAmount,
  getToken,
  TokenInfo,
  GetBridgeFeesResult,
  QUERIESV2,
} from "utils";
import CoinSelector from "./CoinSelector";
import EstimatedTable from "./EstimatedTable";
import QuickSwap from "./QuickSwap";
import SlippageAlert from "./SlippageAlert";
import { BigNumber } from "ethers";
import AmountTooLowAlert from "./AmountTooLowAlert";

type BridgeFormProps = {
  availableTokens: TokenInfo[];
  currentToken: string;
  setCurrentToken: (token: string) => void;
  setAmountToBridge: (amount: BigNumber | undefined) => void;
  currentBalance: BigNumber | undefined;
  currentFromRoute: number | undefined;
  setCurrentFromRoute: (chainId: number) => void;
  availableFromRoutes: ChainInfo[];
  availableToRoutes: ChainInfo[];
  currentToRoute: number | undefined;
  setCurrentToRoute: (chainId: number) => void;
  handleQuickSwap: () => void;
  isConnected: boolean;
  isWrongChain: boolean;
  handleChainSwitch: () => void;
  buttonActionHandler: () => void;
  buttonLabel: string;
  isBridgeDisabled: boolean;
  fees: GetBridgeFeesResult | undefined;
  amountToBridge: BigNumber | undefined;
  estimatedTime: string | undefined;
  displayChangeAccount: boolean;
  setDisplayChangeAccount: (display: boolean) => void;
  toAccount?: string;
  amountTooLow: boolean;
  walletAccount?: string;
  disableQuickSwap?: boolean;
};

const BridgeForm = ({
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
  isWrongChain,
  handleChainSwitch,
  isConnected,
  buttonActionHandler,
  buttonLabel,
  isBridgeDisabled,
  fees,
  amountToBridge,
  estimatedTime,
  setDisplayChangeAccount,
  toAccount,
  amountTooLow,
  walletAccount,
  disableQuickSwap,
}: BridgeFormProps) => {
  const mapChainInfoToRoute = (
    c?: ChainInfo,
    superText?: string
  ): JSX.Element | undefined =>
    c ? (
      <ChainIconTextWrapper>
        <ChainIcon src={c.logoURI} />
        <ChainIconSuperTextWrapper>
          {superText && (
            <Text size="sm" color="grey-400">
              {superText}
            </Text>
          )}
          <Text size="md" color="white-100">
            {capitalizeFirstLetter(c.fullName ?? c.name)}
          </Text>
        </ChainIconSuperTextWrapper>
      </ChainIconTextWrapper>
    ) : undefined;

  return (
    <>
      <CardWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            Send
          </Text>
          <CoinSelector
            fromChain={currentFromRoute ?? 1}
            toChain={currentToRoute ?? 1}
            tokenChoices={availableTokens}
            tokenSelected={currentToken}
            onTokenSelected={setCurrentToken}
            onAmountToBridgeChanged={setAmountToBridge}
            currentSelectedBalance={currentBalance}
            walletAccount={walletAccount}
          />
          {amountTooLow && <AmountTooLowAlert />}
        </RowWrapper>
        <RowWrapper>
          <Text size="md" color="grey-400">
            From
          </Text>
          <Selector<number>
            elements={availableFromRoutes.map((r) => ({
              value: r.chainId,
              element: mapChainInfoToRoute(r)!,
            }))}
            selectedValue={currentFromRoute ?? 1}
            setSelectedValue={(v) => setCurrentFromRoute(v)}
            title="Chain"
          />
        </RowWrapper>
        <RowWrapper>
          <PaddedText size="md" color="grey-400">
            To
          </PaddedText>
          <QuickSwapWrapper>
            <QuickSwap
              disabled={disableQuickSwap}
              onQuickSwap={handleQuickSwap}
            />
          </QuickSwapWrapper>
          <FromSelectionStack>
            <Selector<number>
              elements={availableToRoutes.map((r) => ({
                value: r.chainId,
                element: mapChainInfoToRoute(r)!,
              }))}
              displayElement={mapChainInfoToRoute(
                availableToRoutes.filter(
                  (r) => r.chainId === currentToRoute
                )[0],
                toAccount
                  ? `Address: ${shortenAddress(toAccount, "...", 4)}`
                  : undefined
              )}
              selectedValue={currentToRoute ?? 1}
              setSelectedValue={(v) => setCurrentToRoute(v)}
              title="Chain"
            />
            <ChangeAddressLink
              size="sm"
              color="grey-400"
              onClick={() => {
                if (toAccount) setDisplayChangeAccount(true);
              }}
            >
              Change account
            </ChangeAddressLink>
          </FromSelectionStack>
        </RowWrapper>
      </CardWrapper>
      <CardWrapper>
        <SlippageAlert />
        {currentToRoute && (
          <EstimatedTable
            chainId={currentToRoute}
            estimatedTime={estimatedTime}
            gasFee={fees?.relayerGasFee.total}
            bridgeFee={fees?.relayerCapitalFee.total}
            totalReceived={
              fees && amountToBridge && amountToBridge.gt(0)
                ? receiveAmount(amountToBridge, fees)
                : undefined
            }
            token={getToken(currentToken)}
            dataLoaded={isConnected}
          />
        )}
        <Divider />
        {isWrongChain ? (
          <Button onClick={() => handleChainSwitch()}>
            <Text color="dark-grey" weight={500}>
              Switch Network
            </Text>
          </Button>
        ) : (
          <Button
            disabled={isBridgeDisabled}
            onClick={() => {
              buttonActionHandler();
            }}
          >
            <Text color="dark-grey" weight={500}>
              {buttonLabel}
            </Text>
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

const ChainIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

const ChainIcon = styled.img`
  width: 24px;
  height: 24px;
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

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #3e4047;
`;

const Button = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  background: #6cf9d8;
  border-radius: 32px;
  height: 64px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
  }
`;

const ChainIconSuperTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0px;
`;
