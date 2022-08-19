import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  MaxButton,
} from "./StakingForm.styles";
import { capitalizeFirstLetter } from "utils/format";
import { StyledComponent } from "@emotion/styled";
import { Theme } from "@emotion/react";

interface Props {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  valid: boolean;
  buttonText: string;
  Logo: StyledComponent<
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
}

const StakingInputWrapper: React.FC<Props> = ({
  value,
  setValue,
  valid,
  buttonText,
  Logo,
}) => {
  return (
    <InputRow>
      <InputWrapper>
        <Logo />
        <Input
          placeholder="Enter amount"
          value={value}
          type="text"
          onChange={(e) => setValue(e.target.value)}
        />
        <MaxButton>Max</MaxButton>
      </InputWrapper>
      <ButtonWrapper>
        <StakeButton valid={valid}>
          {capitalizeFirstLetter(buttonText)}
        </StakeButton>
      </ButtonWrapper>
    </InputRow>
  );
};

export default StakingInputWrapper;
