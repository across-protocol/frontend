import styled from "@emotion/styled";
import { useState } from "react";

import { Alert, Modal, Text } from "components";
import { UnstyledButton } from "components/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  currentSlippage: number;
  onConfirm: (validSlippage: number) => void;
};

export function SwapSlippageModal(props: Props) {
  const [userInput, setUserInput] = useState(props.currentSlippage.toString());
  const [error, setError] = useState<string | undefined>();

  const handleClickConfirm = () => {
    const newSlippage = Number(userInput);
    if (Number.isNaN(newSlippage)) {
      setError("Invalid input");
      return;
    }
    if (newSlippage < 0 || newSlippage > 50) {
      setError("Slippage must be between 0% and 50%");
      return;
    }
    props.onConfirm(Number(newSlippage.toFixed(2)));
  };

  return (
    <Modal
      title="Slippage for token swap"
      exitModalHandler={props.onClose}
      isOpen={props.isOpen}
      width={550}
      height={900}
      exitOnOutsideClick
    >
      <Wrapper>
        <Alert status="base">
          <Text color="grey-400">
            Your bridge will not go through if the price increases by more than
            this percentage.
          </Text>
        </Alert>
        <Row>
          <Text color="grey-400">Max. slippage</Text>
          <InputWrapper>
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <Text size="lg" color="light-200">
              %
            </Text>
          </InputWrapper>
        </Row>
        {error && (
          <Row>
            <div />
            <Text color="error">{error}</Text>
          </Row>
        )}
        <Divider />
        <Row>
          <div />
          <div>
            <CancelButton onClick={props.onClose}>
              <Text color="grey-400">Cancel</Text>
            </CancelButton>
            <ConfirmButton onClick={handleClickConfirm}>
              <Text color="white">Confirm</Text>
            </ConfirmButton>
          </div>
        </Row>
      </Wrapper>
    </Modal>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 24px;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 48px;
  padding: 9px 12px 9px 16px;

  border-radius: 12px;
  border: 1px solid var(--Color-Neutrals-grey-400, #9daab3);
  background: var(--Color-Neutrals-black-800, #2d2e33);
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
`;

const Input = styled.input`
  border: none;
  max-width: 112px;
  background: var(--Color-Neutrals-black-800, #2d2e33);
  color: var(--Color-Neutrals-light-200, #e0f3ff);
  box-shadow: none;
  outline: none;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Divider = styled.div`
  border-top: 1px solid #3f4047;
  width: 100%;
`;

const CancelButton = styled(UnstyledButton)`
  margin-right: 24px;

  &:hover {
    opacity: 0.8;
  }
`;

const ConfirmButton = styled(UnstyledButton)`
  border-radius: 10px;
  border: 1px solid var(--Color-Interface-White, #fff);

  height: 40px;
  padding: 0px 20px;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
`;
