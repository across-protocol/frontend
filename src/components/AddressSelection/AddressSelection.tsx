import React, { useState, useEffect } from "react";
import { XOctagon } from "react-feather";
import { useConnection, useSend } from "state/hooks";
import { CHAINS, shortenAddress, isValidAddress } from "utils";
import { SectionTitle } from "../Section";
import Dialog from "../Dialog";
import { SecondaryButton } from "../Buttons";
import {
  LastSection,
  Wrapper,
  MainBox,
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
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (toAddress) {
      setAddress(toAddress);
    }
  }, [toAddress]);

  const toggle = () => {
    // modal is closing, reset address to the current toAddress
    if (open) setAddress(toAddress || address);
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
    <LastSection>
      <Wrapper>
        <SectionTitle>To</SectionTitle>
        <MainBox>
          <Logo src={CHAINS[toChain].logoURI} alt={CHAINS[toChain].name} />
          <Info>
            <div>{CHAINS[toChain].name}</div>
            {toAddress && <Address>{shortenAddress(toAddress)}</Address>}
          </Info>
          <ChangeButton onClick={toggle} disabled={!isConnected}>
            Change
          </ChangeButton>
        </MainBox>
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
    </LastSection>
  );
};

export default AddressSelection;
