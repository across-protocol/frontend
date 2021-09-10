import React from "react";
import styled from "@emotion/styled";
import optimism from "../../assets/optimism.svg";
import { PrimaryButton as UnstyledButton } from "../BaseButton";

const Network: React.FC = () => {
  return (
    <div>
      <Heading>From</Heading>
      <Option>
        <Logo src={optimism} alt="optimism logo" />
        <span>Optimism</span>
      </Option>
      <Button>Approve Optimism</Button>
    </div>
  );
};

export default Network;

const Button = styled(UnstyledButton)`
  width: 100%;
  font-size: ${18 / 16}rem;
`;

const Heading = styled.h3`
  font-size: ${20 / 16}rem;
  font-weight: bold;
  margin-bottom: 16px;
`;
const Logo = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 20px;
`;
const Option = styled.div`
  padding: 15px 20px;
  border-radius: 32px;
  background-color: var(--gray-light);
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;
