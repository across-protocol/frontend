import React, { useState } from "react";
import { XOctagon } from "react-feather";
import { useConnection, useSend } from "state/hooks";
import { CHAINS, shortenAddress, isValidAddress } from "utils";
import { Section, SectionTitle } from "../Section";
import Dialog from "../Dialog";
import { SecondaryButton } from "../Buttons";
import {
  Wrapper,
  RoundBox,
  Logo,
  ChangeButton,
  Address,
  Info,
  InputWrapper,
  Input,
  ClearButton,
  CancelButton,
  ButtonGroup,
  InputError,
} from "./AddressSelection.styles";

const AddressSelection: React.FC = () => {
  const { isConnected } = useConnection();
  const { toChain, toAddress, setToAddress } = useSend();
  const [address, setAddress] = useState(toAddress);
  const [open, setOpen] = React.useState(false);

  const toggle = () => {
    setOpen((oldOpen) => !oldOpen);
  };
  const clearInput = () => {
    setAddress("");
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(evt.target.value);
  };
  const isValid = !address || isValidAddress(address);
  const handleSubmit = () => {
    if (isValid && address) {
      setToAddress({ toAddress: address });
      toggle();
    }
  };

  return (
    <Section>
      <Wrapper>
        <SectionTitle>To</SectionTitle>
        <RoundBox>
          <Logo src={CHAINS[toChain].logoURI} alt={CHAINS[toChain].name} />
          <Info>
            <div>{CHAINS[toChain].name}</div>
            {toAddress && <Address>{shortenAddress(toAddress)}</Address>}
          </Info>
          <ChangeButton onClick={toggle} disabled={!isConnected}>
            Change
          </ChangeButton>
        </RoundBox>
      </Wrapper>
      <Dialog isOpen={open} onClose={toggle}>
        <h3>Send To</h3>
        <div>Address on {CHAINS[toChain].name}</div>
        <InputWrapper>
          <Input onChange={handleChange} value={address} />
          <ClearButton onClick={clearInput}>
            <XOctagon
              fill="var(--color-gray-300)"
              stroke="var(--color-white)"
            />
          </ClearButton>
          {!isValid && <InputError>Not a valid address</InputError>}
        </InputWrapper>

        <ButtonGroup>
          <CancelButton onClick={toggle}>Cancel</CancelButton>
          <SecondaryButton
            onClick={handleSubmit}
            disabled={!isValid || !address}
          >
            Save Changes
          </SecondaryButton>
        </ButtonGroup>
      </Dialog>
    </Section>
  );
};

export default AddressSelection;
