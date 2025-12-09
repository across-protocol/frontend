import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { BigNumber } from "ethers";
import styled from "@emotion/styled";
import {
  COLORS,
  formatUnitsWithMaxFractions,
  compareAddressesSimple,
} from "utils";
import { useUserTokenBalances } from "hooks/useUserTokenBalances";
import { useAmplitude } from "hooks/useAmplitude";
import { ampli } from "ampli";

type BalanceSelectorProps = {
  token: {
    chainId: number;
    address: string;
    decimals: number;
  };
  setAmount: (amount: BigNumber | null) => void;
  disableHover?: boolean;
  error?: boolean;
};

export function BalanceSelector({
  token,
  setAmount,
  disableHover,
  error = false,
}: BalanceSelectorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const tokenBalances = useUserTokenBalances();
  const { addToAmpliQueue } = useAmplitude();

  // Derive the balance from the latest token balances
  const balance = useMemo(() => {
    if (!tokenBalances.data?.balances) {
      return BigNumber.from(0);
    }

    const chainBalances = tokenBalances.data.balances.find(
      (cb) => cb.chainId === String(token.chainId)
    );

    if (!chainBalances) {
      return BigNumber.from(0);
    }

    const tokenBalance = chainBalances.balances.find((b) =>
      compareAddressesSimple(b.address, token.address)
    );

    return tokenBalance?.balance
      ? BigNumber.from(tokenBalance.balance)
      : BigNumber.from(0);
  }, [tokenBalances.data, token.chainId, token.address]);

  const percentages = ["25%", "50%", "75%", "MAX"];

  const handlePillClick = (percentage: string) => {
    const percentValue =
      percentage === "MAX" ? "100" : percentage.replace("%", "");
    addToAmpliQueue(() => {
      ampli.inputAmountPercentClicked({
        percent: percentValue as "25" | "50" | "75" | "100",
      });
    });

    if (percentage === "MAX") {
      setAmount(balance);
    } else {
      const percent = parseInt(percentage) / 100;
      const amount = balance.mul(Math.floor(percent * 10000)).div(10000);
      setAmount(amount);
    }
  };

  const formattedBalance = formatUnitsWithMaxFractions(balance, token.decimals);

  return (
    <BalanceWrapper
      onMouseEnter={() => !disableHover && balance.gt(0) && setIsHovered(true)}
      onMouseLeave={() => !disableHover && setIsHovered(false)}
    >
      <PillsContainer>
        <AnimatePresence>
          {isHovered &&
            balance.gt(0) &&
            percentages.map((percentage, index) => (
              <motion.div
                key={percentage}
                className="pill"
                initial={{ opacity: 0, scale: 0.8, y: 0, x: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 0,
                  x: 10,
                  transition: {
                    duration: 0.08,
                    delay: index * 0.05,
                    ease: "easeIn",
                  },
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 28,
                  delay: (percentages.length - 1 - index) * 0.07,
                }}
                whileHover={{
                  scale: 1.06,
                  backgroundColor: "rgba(224, 243, 255, 0.1)",
                  color: "#E0F3FF",
                }}
                onClick={() => handlePillClick(percentage)}
              >
                {percentage}
              </motion.div>
            ))}
        </AnimatePresence>
      </PillsContainer>
      <BalanceText error={error}>
        <span>Balance:</span> {formattedBalance}
      </BalanceText>
    </BalanceWrapper>
  );
}

const BalanceWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  position: relative;
  justify-content: flex-end;
  margin-left: auto;
`;

const BalanceText = styled.div<{ error?: boolean }>`
  color: ${({ error }) =>
    error ? COLORS.error : "var(--Base-bright-gray, #E0F3FF)"};
  opacity: 1;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;

  span {
    opacity: 0.5;
    color: var(--Base-bright-gray, #e0f3ff);
  }
`;

const PillsContainer = styled.div`
  --spacing: 4px;
  display: flex;
  align-items: center;
  gap: var(--spacing);
  position: absolute;
  right: 100%;
  padding-right: calc(var(--spacing) * 2);

  .pill {
    display: flex;
    height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(224, 243, 255, 0.5);
    background-color: rgba(224, 243, 255, 0.05);
    color: rgba(224, 243, 255, 0.5);
    cursor: pointer;
    user-select: none;
  }
`;
