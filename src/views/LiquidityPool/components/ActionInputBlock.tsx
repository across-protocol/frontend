import styled from "@emotion/styled";
import { useState, useCallback } from "react";

import { QUERIESV2 } from "utils";
import { InputWithMaxButton } from "components";

import { Button } from "../LiquidityPool.styles";

type Props = {
  action: "add" | "remove";
};

export function ActionInputBlock({ action }: Props) {
  const [amount, setAmount] = useState("");

  const actionButtonText =
    action === "add" ? "Add liquidity" : "Remove liquidity";

  const handleAction = useCallback(() => {
    console.log("action", action);
    console.log("amount", amount);
  }, [action, amount]);

  return (
    <Wrapper>
      <InputRow>
        <InputWithMaxButton
          valid={false}
          invalid={false}
          value={amount}
          onChangeValue={(e) => setAmount(e.target.value)}
          disableInput={false}
          onEnterKeyDown={handleAction}
          onClickMaxButton={() => setAmount("0")}
          maxValue={"0"}
          disableTokenIcon
        />

        <ButtonWrapper>
          <Button
            size="lg"
            onClick={handleAction}
            isRemove={action === "remove"}
          >
            {actionButtonText}
          </Button>
        </ButtonWrapper>
      </InputRow>
    </Wrapper>
  );
}

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  align-items: center;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 12px;
  }
`;

export const ButtonWrapper = styled.div`
  flex-shrink: 0;
  @media ${QUERIESV2.sm.andDown} {
    width: 100%;
  }
`;
