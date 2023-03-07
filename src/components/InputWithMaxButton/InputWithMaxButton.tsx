import {
  InputWrapper,
  Input,
  MaxButton,
  TokenIcon,
} from "./InputWithMaxButton.styles";

interface Props {
  value: string;
  onChangeValue: React.InputHTMLAttributes<HTMLInputElement>["onChange"];
  valid: boolean;
  invalid: boolean;
  logoURI?: string;
  maxValue: string;
  onEnterKeyDown: () => void | Promise<void>;
  onClickMaxButton: () => void | Promise<void>;
  disableInput?: boolean;
  disableTokenIcon?: boolean;
}

export function InputWithMaxButton({
  value,
  onChangeValue,
  valid,
  invalid,
  logoURI,
  maxValue,
  onEnterKeyDown,
  onClickMaxButton,
  disableInput,
  disableTokenIcon,
}: Props) {
  return (
    <InputWrapper valid={valid} invalid={invalid}>
      {!disableTokenIcon && <TokenIcon src={logoURI} />}
      <Input
        valid={valid}
        invalid={invalid}
        placeholder="Enter amount"
        value={value}
        type="text"
        onChange={onChangeValue}
        disabled={disableInput}
        onKeyDown={(e) => e.key === "Enter" && valid && onEnterKeyDown()}
      />
      <MaxButton
        disabled={disableInput || !maxValue}
        onClick={onClickMaxButton}
      >
        Max
      </MaxButton>
    </InputWrapper>
  );
}

export default InputWithMaxButton;
