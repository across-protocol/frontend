import { FC } from "react";
import styled from "@emotion/styled";
import { PrimaryButton } from "../Buttons";
import { Check, ArrowUpRight } from "react-feather";

interface Props {
  depositUrl: string;
  setShowSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setDepositUrl: React.Dispatch<React.SetStateAction<string>>;
}
const DepositSuccess: FC<Props> = ({
  depositUrl,
  setShowSuccess,
  setDepositUrl,
}) => {
  return (
    <div>
      <DepositTopWrapper>
        <SuccessText>Deposit succeeded</SuccessText>
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
            setShowSuccess(false);
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
  background-color: #2d2e33;
  text-align: center;
  padding: 1rem;
`;

const SuccessText = styled.h2`
  font-size: 1.5rem;
  color: #ffffff;
  line-height: 2rem;
  font-family: "Barlow";
  font-weight: 700;
  margin-top: 1.5rem;
`;

const CheckMarkWrapper = styled.div`
  background-color: hsla(166, 92%, 70%, 1);
  height: 70px;
  width: 70px;
  border-radius: 36px;
  margin: 1rem auto;
  svg {
    margin-top: 24px;
    color: #2d2e33;
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
  margin-top: 1rem;
  padding-top: 1rem;
  a {
    color: hsla(166, 92%, 70%, 1);
    font-size: 0.875rem;
    font-family: "Barlow";
    font-weight: 400;
    text-decoration: underline;

    &:hover {
      cursor: pointer;
    }
  }
`;

const DepositButton = styled(PrimaryButton)`
  margin-top: 2rem;
  width: 95%;
  margin-left: auto;
  margin-right: auto;

  background: hsla(166, 92%, 70%, 1);
  color: hsla(230, 6%, 19%, 1);
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.25rem;
  a {
    text-decoration: underline;
    &:hover {
      cursor: pointer;
    }
  }
`;
