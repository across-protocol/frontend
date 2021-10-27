import { FC, ChangeEvent } from "react";
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
  buttonClickHandler: () => void;
}

const AddLiquidityForm: FC<Props> = ({ error, amount, onChange }) => {
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
          <MaxButton
            onClick={() => null}
            // disabled={!isConnected}
          >
            max
          </MaxButton>
          <Input
            placeholder="0.00"
            id="amount"
            value={amount}
            onChange={onChange}
            // disabled={!isConnected}
          />
        </RoundBox>
      </InputGroup>
      <FormButton>Connect wallet</FormButton>
    </>
  );
};

export default AddLiquidityForm;
