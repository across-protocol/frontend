import styled, { StyledComponent } from "@emotion/styled";
import { Selector } from "components";
import { Text } from "components/Text";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { BigNumber, utils } from "ethers";
import {
  formatUnits,
  getChainInfo,
  getConfig,
  isNumberEthersParseable,
  parseUnitsFnBuilder,
  QUERIESV2,
  TokenInfo,
  trackMaxButtonClicked,
} from "utils";
import { useCallback, useEffect, useState } from "react";
import { Theme } from "@emotion/react";
import { SelectorPropType } from "components/Selector/Selector";
import { useBalancesBySymbols, useBridgeLimits, useConnection } from "hooks";

function useCoinSelector(
  tokens: TokenInfo[],
  currentToken: string,
  fromChain: number,
  toChain: number,
  setAmountToBridge: (v: BigNumber | undefined) => void,
  setIsBridgeAmountValid: (v: boolean) => void,
  setIsLiquidityFromAountExceeded: (v: boolean) => void,
  currentBalance?: BigNumber,
  account?: string
) {
  const [userAmountInput, setUserAmountInput] = useState("");
  const [validInput, setValidInput] = useState(true);
  const { isConnected } = useConnection();
  const token =
    tokens.find((t) => t.symbol.toLowerCase() === currentToken.toLowerCase()) ??
    tokens[0];
  const tokenFormatterFn = (wei: BigNumber) =>
    utils.formatUnits(wei, token.decimals);
  const tokenParserFn = parseUnitsFnBuilder(token.decimals);
  const maxBalanceOnClick = () => {
    if (currentBalance) {
      setUserAmountInput(tokenFormatterFn(currentBalance));
      trackMaxButtonClicked("bridgeForm");
    }
  };

  const queryableTokens = tokens.filter((t) => {
    try {
      const config = getConfig();
      config.getTokenInfoBySymbol(fromChain, t.symbol);
      return true;
    } catch (_e: unknown) {
      return false;
    }
  });

  const { limits } = useBridgeLimits(currentToken, fromChain, toChain);

  const tokenBalances = useBalancesBySymbols({
    tokenSymbols: queryableTokens.map((t) => t.symbol),
    chainId: fromChain,
    account,
  });
  const disabledSelector = !!account && tokenBalances.isLoading;
  const balances: Record<string, BigNumber> = Object.fromEntries(
    tokenBalances.balances.map((b, idx) => [
      queryableTokens[idx].symbol,
      b ?? BigNumber.from(0),
    ])
  );

  const [displayBalance, setDisplayBalance] = useState(false);

  const validateAndSetUserInput = useCallback(() => {
    setValidInput(true);
    setIsLiquidityFromAountExceeded(false);
    if (
      userAmountInput === "" ||
      userAmountInput === "." ||
      userAmountInput === "0." ||
      userAmountInput === "0"
    ) {
      setAmountToBridge(undefined);
    } else {
      const parsedUserInput = tokenParserFn(
        isNumberEthersParseable(userAmountInput) ? userAmountInput : "-1"
      );
      if (
        parsedUserInput.gt(0) &&
        (!limits || parsedUserInput.lte(limits.maxDeposit))
      ) {
        setAmountToBridge(parsedUserInput);
        setValidInput(!currentBalance || parsedUserInput.lte(currentBalance));
      } else {
        setAmountToBridge(undefined);
        setValidInput(false);
        setIsLiquidityFromAountExceeded(true);
      }
    }
  }, [
    currentBalance,
    limits,
    setAmountToBridge,
    tokenParserFn,
    userAmountInput,
    setIsLiquidityFromAountExceeded,
  ]);

  useEffect(() => {
    setIsBridgeAmountValid(validInput);
  }, [validInput, setIsBridgeAmountValid]);

  // Create a useEffect to validate the user input to be a valid big number greater than 0 and less than the current balance
  // If the user input is valid, set the amount to bridge to the user input value converted to a BigNumber with the tokenParserFn
  // If the user input is invalid, set the amount to bridge to undefined
  // If the user input is empty, set the amount to bridge to undefined
  useEffect(() => {
    validateAndSetUserInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAmountInput]);

  useEffect(() => {
    if (isConnected) {
      validateAndSetUserInput();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  useEffect(() => {
    setUserAmountInput("");
    setAmountToBridge(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken, toChain, fromChain]);

  return {
    token,
    tokenFormatterFn,
    userAmountInput,
    setUserAmountInput,
    maxBalanceOnClick,
    validInput,
    displayBalance,
    setDisplayBalance,
    disabledSelector,
    balances,
  };
}

type CoinSelectorPropType = {
  currentSelectedBalance?: BigNumber;
  onAmountToBridgeChanged: (v: BigNumber | undefined) => void;
  tokenChoices: TokenInfo[];
  onTokenSelected: (s: string) => void;

  tokenSelected: string;
  toChain: number;
  fromChain: number;

  walletAccount?: string;

  setIsBridgeAmountValid: (v: boolean) => void;
  setIsLiquidityFromAountExceeded: (v: boolean) => void;
};

const CoinSelector = ({
  currentSelectedBalance,
  onAmountToBridgeChanged,
  tokenSelected,
  onTokenSelected,
  tokenChoices,
  fromChain,
  toChain,
  walletAccount,
  setIsBridgeAmountValid,
  setIsLiquidityFromAountExceeded,
}: CoinSelectorPropType) => {
  const {
    token,
    tokenFormatterFn,
    userAmountInput,
    setUserAmountInput,
    maxBalanceOnClick,
    validInput,
    displayBalance,
    setDisplayBalance,
    disabledSelector,
    balances,
  } = useCoinSelector(
    tokenChoices,
    tokenSelected,
    fromChain,
    toChain,
    onAmountToBridgeChanged,
    setIsBridgeAmountValid,
    setIsLiquidityFromAountExceeded,
    currentSelectedBalance,
    walletAccount
  );

  return (
    <Wrapper>
      <AmountWrapper valid={validInput}>
        <AmountInnerWrapper>
          <AmountInnerWrapperTextStack>
            {currentSelectedBalance && (displayBalance || userAmountInput) && (
              <Text size="sm" color="grey-400">
                Balance: {tokenFormatterFn(currentSelectedBalance)}{" "}
                {token.symbol.toUpperCase()}
              </Text>
            )}
            <AmountInnerInput
              valid={validInput}
              placeholder="Enter amount"
              value={userAmountInput}
              onChange={(e) => setUserAmountInput(e.target.value)}
              onFocus={() => setDisplayBalance(true)}
              onBlur={() => setDisplayBalance(false)}
              data-cy="bridge-amount-input"
            />
          </AmountInnerWrapperTextStack>
          <MaxButtonWrapper
            onClick={() => maxBalanceOnClick()}
            disabled={!currentSelectedBalance}
          >
            MAX
          </MaxButtonWrapper>
        </AmountInnerWrapper>
      </AmountWrapper>
      <TokenSelection
        elements={tokenChoices.map((t) => ({
          value: t.symbol,
          disabled: !getConfig().routes.some(
            (r) =>
              toChain === r.toChain &&
              fromChain === r.fromChain &&
              r.fromTokenSymbol === t.symbol
          ),
          disabledTooltip: {
            title: "Asset not supported.",
            description: `${t.symbol.toUpperCase()} is not supported on ${
              getChainInfo(fromChain).name
            }. Pick a different asset or change the destination chain.`,
          },
          element: (
            <CoinIconTextWrapper>
              <CoinIcon src={t.logoURI} />
              <Text size="md" color="white-100">
                {t.symbol.toUpperCase()}
              </Text>
            </CoinIconTextWrapper>
          ),
          suffix:
            balances && balances[t.symbol]?.gt(0) ? (
              <Text size="md" color="grey-400">
                {formatUnits(
                  balances[t.symbol] ?? BigNumber.from(0),
                  t.decimals
                )}
              </Text>
            ) : undefined,
        }))}
        displayElement={
          <CoinIconTextWrapper>
            <CoinIcon src={token.logoURI} />
            <Text size="md" color="white-100">
              {token.symbol.toUpperCase()}
            </Text>
          </CoinIconTextWrapper>
        }
        selectedValue={tokenSelected}
        title="Coins"
        setSelectedValue={(v) => onTokenSelected(v)}
        disabled={disabledSelector}
      />
    </Wrapper>
  );
};

export default CoinSelector;

const Wrapper = styled.div`
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

interface IValidInput {
  valid: boolean;
}

const AmountWrapper = styled.div<IValidInput>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 9px 20px 9px 32px;
  background: #2d2e33;
  border: 1px solid ${({ valid }) => (!valid ? "#f96c6c" : "#4c4e57")};
  border-radius: 32px;

  width: calc(70% - 6px);
  height: 64px;

  flex-shrink: 0;

  @media ${QUERIESV2.sm.andDown} {
    height: 48px;
    padding: 6px 12px 6px 24px;
  }

  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
`;

const AmountInnerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  padding: 0px;
  gap: 16px;
  width: 100%;
`;

const TokenSelection = styled(Selector)`
  width: calc(30% - 6px);

  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
` as StyledComponent<
  SelectorPropType<string> & {
    theme?: Theme | undefined;
  },
  {},
  {}
>;

const MaxButtonWrapper = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 10px;

  height: 24px;
  width: fit-content;

  border: 1px solid #4c4e57;
  border-radius: 24px;

  cursor: pointer;

  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c5d5e0;

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }
`;

const AmountInnerWrapperTextStack = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  padding: 0px;
`;

const AmountInnerInput = styled.input<IValidInput>`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;

  color: ${({ valid }) => (!valid ? "#f96c6c" : "#e0f3ff")};
  background: none;

  width: 100%;
  padding: 0;
  border: none;
  outline: 0;

  &:focus {
    outline: 0;
    font-size: 18px;
  }

  &::placeholder {
    color: #9daab3;
  }

  overflow-x: hidden;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
    line-height: 20px;
  }
`;

const CoinIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

const CoinIcon = styled.img`
  width: 24px;
  height: 24px;
`;
