import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  MaxButton,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import { StyledComponent } from "@emotion/styled";
import { Theme } from "@emotion/react";

type StylizedSVGComponent = StyledComponent<
  React.SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  } & {
    children?: React.ReactNode;
  } & {
    theme?: Theme | undefined;
  },
  {},
  {}
>;

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  valid: boolean;
  buttonText: string;
  Logo: StylizedSVGComponent;
  maxValue: string;
  omitInput?: boolean;
  onClickHandler: () => void;
}

const StakingInputBlock: React.FC<Props> = ({
  value,
  setValue,
  valid,
  buttonText,
  Logo,
  maxValue,
  omitInput,
  onClickHandler,
}) => {
  return (
    <InputRow>
      {!omitInput && (
        <InputWrapper>
          <Logo />
          <Input
            placeholder="Enter amount"
            value={value}
            type="text"
            onChange={(e) => setValue(e.target.value)}
            valid={!value || valid}
          />
          <MaxButton onClick={() => setValue(maxValue ?? "")}>Max</MaxButton>
        </InputWrapper>
      )}
      <ButtonWrapper>
        <StakeButton
          valid={valid}
          fullWidth={omitInput}
          onClick={onClickHandler}
        >
          {capitalizeFirstLetter(buttonText)}
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  );
};

export default StakingInputBlock;
