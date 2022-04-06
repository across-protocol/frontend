import { FC, useState, useEffect, useCallback } from "react";
import { ethers, BigNumber } from "ethers";
import Tabs from "../Tabs";
import AddLiquidityForm from "./AddLiquidityForm";
import RemoveLiquidityForm from "./RemoveLiquidityForm";
import { QuerySubState } from "@reduxjs/toolkit/dist/query/core/apiState";
import {
  Wrapper,
  Info,
  InfoText,
  Logo,
  TabContentWrapper,
  Position,
  PositionItem,
  ROI,
  ROIItem,
} from "./PoolForm.styles";
import {
  formatUnits,
  formatEtherRaw,
  max,
  numberFormatter,
  estimateGasForAddEthLiquidity,
  DEFAULT_ADD_LIQUIDITY_ETH_GAS_ESTIMATE,
  UPDATE_GAS_INTERVAL_MS,
  toWeiSafe,
} from "utils";
import { useConnection } from "state/hooks";
import type { ShowSuccess } from "views/Pool";

interface Props {
  symbol: string;
  icon: string;
  decimals: number;
  apy: string;
  totalPoolSize: ethers.BigNumber;
  totalPosition: ethers.BigNumber;
  position: ethers.BigNumber;
  feesEarned: ethers.BigNumber;
  hubPoolAddress: string;
  lpTokens: ethers.BigNumber;
  tokenAddress: string;
  ethBalance: QuerySubState<any> | null | undefined;
  erc20Balances: QuerySubState<any> | null | undefined;
  setShowSuccess: React.Dispatch<React.SetStateAction<ShowSuccess | undefined>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
  balance: string;
  wrongNetwork?: boolean;
  // refetch balance
  refetchBalance: () => void;
  defaultTab: string;
  setDefaultTab: React.Dispatch<React.SetStateAction<string>>;
  utilization: string;
  projectedApr: string;
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
  hubPoolAddress,
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
  projectedApr,
}) => {
  const [inputAmount, setInputAmount] = useState("");
  const [removeAmount, setRemoveAmount] = useState(0);
  const [error] = useState<Error>();
  const [formError, setFormError] = useState("");
  const [addLiquidityGas, setAddLiquidityGas] = useState<ethers.BigNumber>(
    DEFAULT_ADD_LIQUIDITY_ETH_GAS_ESTIMATE
  );
  const { isConnected, signer } = useConnection();

  // update our add-liquidity to contract call gas usage on an interval for eth only
  useEffect(() => {
    if (!signer || !isConnected || symbol !== "ETH") return;

    estimateGasForAddEthLiquidity(signer, tokenAddress)
      .then(setAddLiquidityGas)
      .catch((err) => {
        console.error("Error getting estimating gas usage", err);
      });

    // get gas estimate on an interval
    const handle = setInterval(() => {
      estimateGasForAddEthLiquidity(signer, tokenAddress)
        .then(setAddLiquidityGas)
        .catch((err) => {
          console.error("Error getting estimating gas usage", err);
        });
    }, UPDATE_GAS_INTERVAL_MS);

    return () => clearInterval(handle);
  }, [signer, isConnected, tokenAddress, symbol]);

  // Validate input on change
  useEffect(() => {
    const value = inputAmount;
    try {
      // liquidity button should be disabled if value is 0, so we dont actually need an error.
      if (Number(value) === 0) return setFormError("");
      if (Number(value) < 0) return setFormError("Cannot be less than 0.");
      if (value && balance) {
        const valueToWei = toWeiSafe(value, decimals);
        if (valueToWei.gt(balance)) {
          return setFormError("Liquidity amount greater than balance.");
        }
      }

      if (value && symbol === "ETH") {
        const valueToWei = toWeiSafe(value, decimals);
        if (valueToWei.add(addLiquidityGas).gt(balance)) {
          return setFormError("Transaction may fail due to insufficient gas.");
        }
      }
    } catch (e) {
      return setFormError("Invalid number.");
    }
    // clear form if no errors were presented. All errors should return early.
    setFormError("");
  }, [inputAmount, balance, decimals, symbol, addLiquidityGas]);

  const handleMaxClick = useCallback(() => {
    let value = ethers.utils.formatUnits(balance, decimals);
    if (symbol !== "ETH") return setInputAmount(value);
    value = formatEtherRaw(
      max("0", BigNumber.from(balance).sub(addLiquidityGas))
    );
    setInputAmount(value);
  }, [balance, decimals, symbol, addLiquidityGas]);

  // if pool changes, set input value to "".
  useEffect(() => {
    setInputAmount("");
    setFormError("");
    setRemoveAmount(0);
  }, [tokenAddress]);

  return (
    <Wrapper>
      <Info>
        <Logo src={icon} />
        <InfoText>{symbol} Pool</InfoText>
      </Info>
      <Position>
        <PositionItem>
          <div>Position Size</div>
          <div>
            {formatUnits(totalPosition, decimals).replace("-", "")} {symbol}
          </div>
        </PositionItem>
        <PositionItem>
          <div>Total fees earned</div>
          <div>
            {formatUnits(feesEarned, decimals)} {symbol}
          </div>
        </PositionItem>
      </Position>
      <ROI>
        <ROIItem>
          <div>Total pool size:</div>
          <div>
            {formatUnits(totalPoolSize, decimals)} {symbol}
          </div>
        </ROIItem>
        <ROIItem>
          <div>Pool utilization:</div>
          <div>{formatUnits(utilization, 16)}%</div>
        </ROIItem>
        <ROIItem>
          <div>Current APY:</div>
          <div>{numberFormatter(Number(apy)).replaceAll(",", "")}%</div>
        </ROIItem>
        <ROIItem>
          <div>Projected APY:</div>
          <div>
            {numberFormatter(Number(projectedApr)).replaceAll(",", "")}%
          </div>
        </ROIItem>
      </ROI>
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
            onChange={setInputAmount}
            hubPoolAddress={hubPoolAddress}
            decimals={decimals}
            symbol={symbol}
            tokenAddress={tokenAddress}
            setShowSuccess={setShowSuccess}
            setDepositUrl={setDepositUrl}
            balance={balance}
            setAmount={setInputAmount}
            refetchBalance={refetchBalance}
            onMaxClick={handleMaxClick}
          />
        </TabContentWrapper>
        <TabContentWrapper data-label="Remove">
          <RemoveLiquidityForm
            wrongNetwork={wrongNetwork}
            removeAmount={removeAmount}
            setRemoveAmount={setRemoveAmount}
            lpTokens={lpTokens}
            decimals={decimals}
            symbol={symbol}
            tokenAddress={tokenAddress}
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
