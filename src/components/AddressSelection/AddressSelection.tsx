import React, { useState } from "react";
import styled from "@emotion/styled";
import { XOctagon } from "react-feather";
import { BaseButton, SecondaryButton, PrimaryButton } from "../BaseButton";
import Dialog from "../Dialog";
import { useSelectedSendArgs } from "state/hooks";
import { CHAINS, isValidAddress, shortenAddress } from "utils";

const AddressSelection: React.FC = () => {
  const { address: storeAddress, setAddress, toChain } = useSelectedSendArgs();

  const [isOpen, setOpen] = useState(false);
  const [userAddress, setUserAddress] = useState(storeAddress);

  const isValid = isValidAddress(userAddress ?? "");
  const toggle = () => setOpen((oldOpen) => !oldOpen);
  const handleSubmit = () => {
    if (isValid && userAddress) {
      setAddress({ address: userAddress });
      toggle();
    }
  };
  const clearInput = () => {
    setUserAddress("");
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setUserAddress(evt.target.value);
  };

  return (
    <>
      <Heading>To</Heading>
      <SelectAddress>
        <Logo src={CHAINS[toChain].logoURI} />
        <Info>
          <h6>{CHAINS[toChain].name}</h6>
          <div>{shortenAddress(storeAddress ?? "")}</div>
        </Info>
        <Button onClick={toggle}>Change</Button>
      </SelectAddress>
      <Dialog isOpen={isOpen} onClose={toggle}>
        <Heading>Send to</Heading>
        <ChangeWrapper>
          <ChangeAddress>
            <Input id="address" value={userAddress} onChange={handleChange} />
            <Clear onClick={clearInput}>
              <XOctagon fill="var(--gray-light)" stroke="var(--white)" />
            </Clear>
          </ChangeAddress>
          <ButtonRow>
            <Cancel onClick={toggle}>Cancel</Cancel>
            <SecondaryButton onClick={handleSubmit} disabled={!isValid}>
              Save Changes
            </SecondaryButton>
          </ButtonRow>
        </ChangeWrapper>
      </Dialog>
    </>
  );
};

const Heading = styled.h3`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 16px;
`;

const SelectAddress = styled.div`
  padding: 15px 20px;
  border-radius: 32px;
  background-color: var(--gray-light);
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;
const Logo = styled.img`
  width: 30px;
  height: 30px;

  margin-right: 20px;
  background-color: var(--white);
  border-radius: 99px;
`;
const Info = styled.div`
  color: var(--white-transparent);
  font-size: ${13 / 16}rem;
  & > h6 {
    font-size: ${18 / 16}rem;
    font-weight: 600;
    color: var(--white);
  }
`;

const Button = styled(SecondaryButton)`
  border-radius: 50px;
  padding: 10px 20px;
  text-transform: uppercase;
  margin-left: auto;
`;

const ChangeAddress = styled.label`
  display: flex;
  align-items: center;
  border-radius: 50px;
  background-color: var(--white);
  padding: 16px;
  padding-right: 12px;
  margin-bottom: 25px;
`;
const Clear = styled(BaseButton)`
  padding: 0px;
`;

const Cancel = styled(PrimaryButton)`
  border: 1px solid var(--gray-light);
`;

const Input = styled.input`
  margin-right: auto;
  border: none;
  flex: 1;
  outline-offset: 4px;
`;

const ChangeWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 20px;
  & > button {
    flex: 1;
  }
`;

export default AddressSelection;
