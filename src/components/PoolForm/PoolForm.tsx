import { FC, useState, ChangeEvent, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Tabs from "../Tabs";
import AddLiquidityForm from "./AddLiquidityForm";
import RemoveLiquidityForm from "./RemoveLiquidityForm";
import { QuerySubState } from "@reduxjs/toolkit/dist/query/core/apiState";

import {
  Wrapper,
  Info,
  InfoText,
  ROIWrapper,
  ROIItem,
  Logo,
  TabContentWrapper,
  PositionWrapper,
  PositionBlock,
  PositionBlockItem,
  PositionBlockItemBold,
} from "./PoolForm.styles";
import {
  formatUnits,
  numberFormatter,
  estimateGas,
  getGasPrice,
  DEFAULT_GAS_PRICE,
  GAS_PRICE_BUFFER,
  ADD_LIQUIDITY_ETH_GAS,
} from "utils";
import { toWeiSafe } from "utils/weiMath";
import { useConnection } from "state/hooks";

interface Props {
  symbol: string;
  icon: string;
  decimals: number;
  apy: string;
  totalPoolSize: ethers.BigNumber;
  totalPosition: ethers.BigNumber;
  position: ethers.BigNumber;
  feesEarned: ethers.BigNumber;
  bridgeAddress: string;
  lpTokens: ethers.BigNumber;
  tokenAddress: string;
  ethBalance: QuerySubState<any> | null | undefined;
  erc20Balances: QuerySubState<any> | null | undefined;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
  balance: ethers.BigNumber;
  wrongNetwork?: boolean;
  // refetch balance
  refetchBalance: () => void;
  defaultTab: string;
  setDefaultTab: React.Dispatch<React.SetStateAction<string>>;
  utilization: string;
}

const PoolForm: FC<Props> = ({
  symbol,
  icon,
  decimals,
  totalPoolSize,
  totalPosition,
  apy,
  position,
  feesEarned,
  bridgeAddress,
  lpTokens,
  tokenAddress,
  setShowSuccess,
  setDepositUrl,
  balance,
  wrongNetwork,
  refetchBalance,
  defaultTab,
  setDefaultTab,
  utilization,
}) => {
  const [inputAmount, setInputAmount] = useState("");
  const [removeAmount, setRemoveAmount] = useState(0);
  const [error] = useState<Error>();
  const [formError, setFormError] = useState("");
  const [gasPrice, setGasPrice] = useState<ethers.BigNumber>(DEFAULT_GAS_PRICE);

  const { isConnected, provider } = useConnection();

  useEffect(() => {
    if (!provider || !isConnected) return;
    getGasPrice(provider)
      .then(setGasPrice)
      .catch((err) => console.error("Error getting gas price", err));

    // get gas price on an interval
    const handle = setInterval(() => {
      getGasPrice(provider)
        .then(setGasPrice)
        .catch((err) => console.error("Error getting gas price", err));
    }, 30000);

    return () => clearInterval(handle);
  }, [provider, isConnected]);

  const addLiquidityOnChangeHandler = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormError("");
    setInputAmount(event.target.value);
    validateInput(event.target.value);
  };

  const validateInput = useCallback(
    (value: string) => {
      try {
        if (Number(value) < 0) return setFormError("Cannot be less than 0.");
        if (value && balance) {
          const valueToWei = toWeiSafe(value, decimals);
          if (valueToWei.gt(balance))
            return setFormError("Liquidity amount greater than balance.");
        }

        if (value && symbol === "ETH") {
          const valueToWei = toWeiSafe(value, decimals);

          const approxGas = estimateGas(
            ADD_LIQUIDITY_ETH_GAS,
            gasPrice,
            GAS_PRICE_BUFFER
          );

          if (valueToWei.add(approxGas).gt(balance))
            return setFormError(
              "Transaction may fail due to insufficient gas."
            );
        }
      } catch (e) {
        return setFormError("Invalid number.");
      }
    },
    [balance, decimals, symbol, gasPrice]
  );

  // if pool changes, set input value to "".
  useEffect(() => {
    setInputAmount("");
    setFormError("");
    setRemoveAmount(0);
  }, [bridgeAddress]);
  return (
    <Wrapper>
      <Info>
        <Logo src={icon} />
        <InfoText>{symbol} Pool</InfoText>
        <PositionWrapper>
          <PositionBlock>
            <PositionBlockItem>My deposit</PositionBlockItem>
            <PositionBlockItem>
              {formatUnits(position, decimals)} {symbol}
            </PositionBlockItem>
          </PositionBlock>
          <PositionBlock>
            <PositionBlockItem>Fees earned</PositionBlockItem>
            <PositionBlockItem>
              {Number(formatUnits(feesEarned, decimals)) > 0
                ? formatUnits(feesEarned, decimals)
                : "0.0000"}{" "}
              {symbol}
            </PositionBlockItem>
          </PositionBlock>
          <PositionBlock>
            <PositionBlockItemBold>Total</PositionBlockItemBold>
            <PositionBlockItemBold>
              {formatUnits(totalPosition, decimals)} {symbol}
            </PositionBlockItemBold>
          </PositionBlock>
        </PositionWrapper>
        <ROIWrapper>
          <ROIItem>Total Pool Size:</ROIItem>
          <ROIItem>
            {formatUnits(totalPoolSize, decimals)} {symbol}
          </ROIItem>
        </ROIWrapper>
        <ROIWrapper>
          <ROIItem>Pool Utilization:</ROIItem>
          <ROIItem>{formatUnits(utilization, 16)}%</ROIItem>
        </ROIWrapper>
        <ROIWrapper>
          <ROIItem>Estimated APY:</ROIItem>
          <ROIItem>{numberFormatter(Number(apy)).replaceAll(",", "")}%</ROIItem>
        </ROIWrapper>
      </Info>
      <Tabs
        defaultTab={defaultTab}
        changeDefaultTab={(tab: string) => {
          setDefaultTab(tab);
        }}
      >
        <TabContentWrapper data-label="Add">
          <AddLiquidityForm
            wrongNetwork={wrongNetwork}
            error={error}
            formError={formError}
            amount={inputAmount}
            onChange={addLiquidityOnChangeHandler}
            bridgeAddress={bridgeAddress}
            decimals={decimals}
            symbol={symbol}
            tokenAddress={tokenAddress}
            setShowSuccess={setShowSuccess}
            setDepositUrl={setDepositUrl}
            balance={balance}
            setAmount={setInputAmount}
            gasPrice={gasPrice}
            refetchBalance={refetchBalance}
          />
        </TabContentWrapper>
        <TabContentWrapper data-label="Remove">
          <RemoveLiquidityForm
            wrongNetwork={wrongNetwork}
            removeAmount={removeAmount}
            setRemoveAmount={setRemoveAmount}
            bridgeAddress={bridgeAddress}
            lpTokens={lpTokens}
            decimals={decimals}
            symbol={symbol}
            setShowSuccess={setShowSuccess}
            setDepositUrl={setDepositUrl}
            balance={balance}
            position={position}
            feesEarned={feesEarned}
            totalPosition={totalPosition}
            refetchBalance={refetchBalance}
          />
        </TabContentWrapper>
      </Tabs>
    </Wrapper>
  );
};

export default PoolForm;
