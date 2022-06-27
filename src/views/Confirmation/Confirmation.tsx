import React from "react";
import { Check, ArrowUpRight } from "react-feather";
import {
  ChainId,
  formatUnits,
  shortenAddress,
  receiveAmount,
  getConfig,
  getChainInfo,
  getToken,
} from "utils";
import type { BridgeFees } from "utils";
import { Layout } from "components";
import {
  Wrapper,
  Heading,
  SuccessIcon,
  Link,
  SecondaryLink,
  Info,
  Button,
  Logo,
  InfoSection,
  Header,
  Row,
  SubHeading,
  RouterLink,
} from "./Confirmation.styles";
import { ethers } from "ethers";
import { getConfirmationDepositTime } from "utils";
import { useBridgeLimits } from "hooks";

export type Deposit = {
  txHash: string;
  amount: ethers.BigNumber;
  to: string;
  from: string;
  tokenAddress: string;
  fromChain: ChainId;
  toChain: ChainId;
  fees: BridgeFees;
};
type Props = {
  onClose: () => void;
  deposit?: Deposit;
};
const Confirmation: React.FC<Props> = ({ deposit, onClose }) => {
  const { limits } = useBridgeLimits(
    deposit?.tokenAddress,
    deposit?.fromChain,
    deposit?.toChain
  );
  if (!deposit) return null;
  const config = getConfig();
  const amountMinusFees = receiveAmount(deposit.amount, deposit.fees);
  const fromTokenInfo = config.getTokenInfoByAddress(
    deposit.fromChain,
    deposit.tokenAddress
  );
  const ethInfo = getToken("ETH");
  const fromChainInfo = getChainInfo(deposit.fromChain);
  const toChainInfo = getChainInfo(deposit.toChain);
  const isWETH = fromTokenInfo?.symbol === "WETH";
  const confirmationTime = limits
    ? getConfirmationDepositTime(deposit.amount, limits, deposit.toChain)
    : undefined;

  return (
    <Layout>
      <Wrapper>
        <Header>
          <Heading>Deposit succeeded</Heading>
          <SubHeading>
            Your funds will arrive in {confirmationTime || "loading"}
          </SubHeading>
          <SubHeading>
            To monitor progress, go to the
            <RouterLink to="/transactions">transactions page</RouterLink>
          </SubHeading>
          <SuccessIcon>
            <Check strokeWidth={4} />
          </SuccessIcon>
        </Header>
        <InfoSection>
          <Link
            href={fromChainInfo.constructExplorerLink(deposit.txHash)}
            target="_blank"
            rel="noopener norefferrer"
          >
            Explorer <ArrowUpRight width={16} height={16} />
          </Link>
          <div>
            <Row>
              <Info>
                <h3>Sending</h3>
                <div>
                  <Logo
                    src={fromTokenInfo.logoURI}
                    alt={`${fromTokenInfo.symbol} logo`}
                  />
                  <div>
                    {formatUnits(deposit.amount, fromTokenInfo.decimals)}{" "}
                    {fromTokenInfo.symbol}
                  </div>
                </div>
              </Info>
              <Info></Info>
              <Info>
                <h3>Receiving</h3>
                <div>
                  <Logo
                    src={isWETH ? ethInfo.logoURI : fromTokenInfo.logoURI}
                    alt={`${
                      isWETH ? ethInfo.symbol : fromTokenInfo.symbol
                    } logo`}
                  />
                  <div>
                    {formatUnits(
                      amountMinusFees,
                      isWETH ? ethInfo.decimals : fromTokenInfo.decimals
                    )}{" "}
                    {isWETH ? ethInfo.symbol : fromTokenInfo?.symbol}
                  </div>
                </div>
              </Info>
            </Row>
            <Info>
              <h3>From</h3>
              <div>
                <Logo
                  src={fromChainInfo.logoURI}
                  alt={`${fromChainInfo.name} logo`}
                />
                <div>
                  <SecondaryLink
                    href={`${fromChainInfo.explorerUrl}/address/${deposit.from}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{deposit.from}</span>
                    <span>{shortenAddress(deposit.from, "...", 10)}</span>
                  </SecondaryLink>
                </div>
              </div>
            </Info>
            <Info>
              <h3>To</h3>
              <div>
                <Logo
                  src={toChainInfo.logoURI}
                  alt={`${toChainInfo.name} logo`}
                />
                <div>
                  <SecondaryLink
                    href={`${toChainInfo.explorerUrl}/address/${deposit.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{deposit.to}</span>
                    <span>{shortenAddress(deposit.to, "...", 10)}</span>
                  </SecondaryLink>
                </div>
              </div>
            </Info>
            <Info>
              <h3>Estimated time of arrival</h3>
              <div>
                <div>{confirmationTime || "loading"}</div>
              </div>
            </Info>
          </div>
          <Button onClick={onClose}>Close</Button>
        </InfoSection>
      </Wrapper>
    </Layout>
  );
};

export default Confirmation;
