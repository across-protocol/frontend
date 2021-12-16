import { FC, useEffect } from "react";
import styled from "@emotion/styled";
import { PrimaryButton } from "../Buttons";
import { Check, ArrowUpRight } from "react-feather";
import type { ShowSuccess } from "views/Pool";

interface Props {
  depositUrl: string;
  setShowSuccess: React.Dispatch<React.SetStateAction<ShowSuccess | undefined>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
  showSuccess: ShowSuccess;
}
const DepositSuccess: FC<Props> = ({
  depositUrl,
  setShowSuccess,
  setDepositUrl,
  showSuccess,
}) => {
  // Make sure we scroll to top when deposit screen mounts
  useEffect(() => {
    window.scroll(0, 0);
  }, []);
  const message =
    showSuccess === "withdraw" ? "Withdrawal succeeded" : "Deposit succeeded";
  return (
    <div>
      <DepositTopWrapper>
        <SuccessText>{message}</SuccessText>
        <CheckMarkWrapper>
          <Check strokeWidth={5} />
        </CheckMarkWrapper>
      </DepositTopWrapper>
      <DepositBottomWrapper>
        <EtherscanUrl>
          <a target="_blank" href={depositUrl} rel="noreferrer">
            Etherscan <ArrowUpRight width={16} height={16} />
          </a>
        </EtherscanUrl>
        <DepositButton
          onClick={() => {
            setShowSuccess(undefined);
            setDepositUrl("");
          }}
        >
          Close
        </DepositButton>
      </DepositBottomWrapper>
    </div>
  );
};

export default DepositSuccess;

const DepositTopWrapper = styled.div`
  background-color: var(--color-gray);
  text-align: center;
  padding: 16px;
`;

const SuccessText = styled.h2`
  font-size: ${24 / 16}rem;
  color: var(--color-white);
  line-height: 1.33;
  font-weight: 700;
  margin-top: 24px;
`;

const CheckMarkWrapper = styled.div`
  background-color: var(--color-primary);
  height: 70px;
  width: 70px;
  border-radius: 36px;
  margin: 16px auto;
  svg {
    margin-top: 24px;
    color: var(--color-gray);
  }
  /* &:before {
    height: 16px;
    width: 16px;
    content: "";
    position: absolute;
    transform: rotate(45deg);
    border: 2px solid #2d2e33;

    height: 2px;
    margin-top: 35px;
    margin-right: 20px;
  }
  &:after {
    height: 16px;
    width: 16px;
    content: "";
    position: absolute;
    transform: rotate(45deg);
    border-color: #2d2e33;
    border-style: solid;
    border-right-width: 2px;
    border-bottom-width: 2px;
    height: 2px;
    margin-top: 35px;
    margin-right: 12px;
  } */
`;

const DepositBottomWrapper = styled.div`
  text-align: center;
  background: linear-gradient(180deg, #334243 0%, rgba(51, 66, 67, 0) 100%);
  min-height: 60vh;
`;

const EtherscanUrl = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  a {
    color: var(--color-primary);
    font-size: ${14 / 16}rem;
    font-weight: 400;
    text-decoration: underline;

    &:hover {
      cursor: pointer;
    }
  }
`;

const DepositButton = styled(PrimaryButton)`
  margin-top: 32px;
  width: 95%;
  margin-left: auto;
  margin-right: auto;
  font-weight: 700;
  font-size: ${18 / 16}rem;
  line-height: 1.1;
  a {
    text-decoration: underline;
    &:hover {
      cursor: pointer;
    }
  }
`;
