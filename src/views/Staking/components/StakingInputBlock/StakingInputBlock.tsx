import {
  InputRow,
  InputWrapper,
  Input,
  ButtonWrapper,
  StakeButton,
  MaxButton,
  Wrapper,
} from "./StakingInputBlock.styles";
import { capitalizeFirstLetter } from "utils/format";
import { StyledComponent } from "@emotion/styled";
import { Theme } from "@emotion/react";
import { AlertInfo } from "../StakingReward/AlertInfo";

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
  maxValue: string;
  errorMessage?: string;
}

const StakingInputBlock: React.FC<Props> = ({
  value,
  setValue,
  valid,
  buttonText,
  Logo,
  maxValue,
  errorMessage,
}) => {
  return (
    <Wrapper>
      <InputRow>
        <InputWrapper valid={!value || valid}>
          <Logo />
          <Input
            placeholder="Enter amount"
            value={value}
            type="text"
            onChange={(e) => setValue(e.target.value)}
          />
          <MaxButton onClick={() => setValue(maxValue ?? "")}>Max</MaxButton>
        </InputWrapper>
        <ButtonWrapper>
          <StakeButton valid={valid}>
            {capitalizeFirstLetter(buttonText)}
          </StakeButton>
        </ButtonWrapper>
      </InputRow>
      {!!value && !valid && !!errorMessage && (
        <AlertInfo danger>{errorMessage}</AlertInfo>
      )}
    </Wrapper>
  );
};

export default StakingInputBlock;
