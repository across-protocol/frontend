import { FC, ChangeEvent } from "react";
import { onboard } from "utils";
import { useConnection } from "state/hooks";
import {
  RoundBox,
  MaxButton,
  Input,
  FormButton,
  InputGroup,
  FormHeader,
} from "./AddLiquidityForm.styles";

interface Props {
  error: Error | undefined;
  amount: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const AddLiquidityForm: FC<Props> = ({ error, amount, onChange }) => {
  const { init } = onboard;
  const { isConnected, provider } = useConnection();

  const handleButtonClick = () => {
    if (!provider) {
      init();
    }
  };
  return (
    <>
      <FormHeader>Amount</FormHeader>

      <InputGroup>
        <RoundBox
          as="label"
          htmlFor="amount"
          style={{
            // @ts-expect-error TS does not likes custom CSS vars
            "--color": error
              ? "var(--color-error-light)"
              : "var(--color-white)",
            "--outline-color": error
              ? "var(--color-error)"
              : "var(--color-primary)",
          }}
        >
          <MaxButton onClick={() => null} disabled={!isConnected}>
            max
          </MaxButton>
          <Input
            placeholder="0.00"
            id="amount"
            value={amount}
            onChange={onChange}
            disabled={!isConnected}
          />
        </RoundBox>
      </InputGroup>
      <FormButton onClick={handleButtonClick}>
        {!isConnected ? "Connect wallet" : "Add liquidity"}
      </FormButton>
    </>
  );
};

export default AddLiquidityForm;
