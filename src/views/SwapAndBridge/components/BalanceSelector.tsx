import { AnimatePresence, motion } from "framer-motion";
import { BigNumber } from "ethers";
import styled from "@emotion/styled";
import { COLORS } from "utils/constants";
import { formatUnitsWithMaxFractions } from "utils/format";
import { useTrackBalanceSelectorClick } from "./useTrackBalanceSelectorClick";
import { useTokenBalance } from "../hooks/useTokenBalance";

type BalanceSelectorProps = {
  token: {
    chainId: number;
    address: string;
    decimals: number;
  };
  setAmount: (amount: BigNumber | null) => void;
  error?: boolean;
  isHovered?: boolean;
};

const percentages = ["25%", "50%", "75%", "MAX"] as const;
export type BalanceSelectorPercentage = (typeof percentages)[number];

export function BalanceSelector({
  token,
  setAmount,
  error = false,
  isHovered = false,
}: BalanceSelectorProps) {
  const balance = useTokenBalance(token);

  const trackBalanceSelectorClick = useTrackBalanceSelectorClick();

  const handlePillClick = (percentage: BalanceSelectorPercentage) => {
    trackBalanceSelectorClick(percentage);

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
    <BalanceWrapper>
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
