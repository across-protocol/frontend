import React, { useState } from "react";
import { Check, ArrowUpRight } from "react-feather";
import {
  TOKENS_LIST,
  CHAINS,
  formatUnits,
  // receiveAmount
} from "utils";
import { useDeposits } from "state/hooks";
import { Layout } from "components";
import {
  Wrapper,
  SuccessIcon,
  Link,
  SecondaryLink,
  Info,
  Button,
  Logo,
  InfoSection,
  Header,
  Row,
  SuccessIconRow,
  ConfirmationIcon,
  ConfirmationLine,
  SuccessInfoRow,
  SuccessInfoBlock,
  SuccessInfoText,
  ConfirmationText,
} from "./NewConfirmation.styles";

const Confirmation: React.FC = () => {
  const { deposit, toggle } = useDeposits();
  const [l1DepositSuccess] = useState(true);

  if (!deposit) return null;
  // const amountMinusFees = receiveAmount(deposit.amount, deposit.fees);

  const tokenInfo = TOKENS_LIST[deposit.fromChain].find(
    (t) => t.address === deposit.token
  );

  return (
    <Layout>
      <Wrapper>
        <Header>
          <SuccessIconRow>
            <SuccessIcon>
              <Check strokeWidth={4} />
            </SuccessIcon>
            {l1DepositSuccess ? (
              <SuccessIcon>
                <Check strokeWidth={4} />
              </SuccessIcon>
            ) : (
              <ConfirmationIcon>
                <div>~2 minutes</div>
              </ConfirmationIcon>
            )}
          </SuccessIconRow>
          {l1DepositSuccess ? <SuccessIconRow /> : <ConfirmationLine />}
          <SuccessInfoRow>
            <SuccessInfoBlock>
              <SuccessInfoText>Deposit succeeded</SuccessInfoText>
              <Link
                href={CHAINS[deposit.fromChain].constructExplorerLink(
                  deposit.txHash
                )}
                target="_blank"
                rel="noopener norefferrer"
              >
                Explorer <ArrowUpRight width={16} height={16} />
              </Link>
            </SuccessInfoBlock>
            <SuccessInfoBlock>
              {l1DepositSuccess ? (
                <>
                  <SuccessInfoText>Transfer succeeded</SuccessInfoText>
                  <Link
                    href={CHAINS[deposit.fromChain].constructExplorerLink(
                      deposit.txHash
                    )}
                    target="_blank"
                    rel="noopener norefferrer"
                  >
                    Explorer <ArrowUpRight width={16} height={16} />
                  </Link>
                </>
              ) : (
                <ConfirmationText>Funds transferred</ConfirmationText>
              )}
            </SuccessInfoBlock>
          </SuccessInfoRow>
        </Header>
        <InfoSection>
          <div>
            <Row>
              <Info>
                <h3>Send</h3>
                <div>
                  <Logo
                    src={tokenInfo?.logoURI}
                    alt={`${tokenInfo?.symbol} logo`}
                  />
                  <div>
                    {formatUnits(deposit.amount, tokenInfo?.decimals ?? 18)}{" "}
                    {tokenInfo?.symbol}
                  </div>
                </div>
              </Info>
              <Info></Info>
              {/* <Info>
                <h3>Receiving</h3>
                <div>
                  <Logo
                    src={tokenInfo?.logoURI}
                    alt={`${tokenInfo?.symbol} logo`}
                  />
                  <div>
                    {formatUnits(amountMinusFees, tokenInfo?.decimals ?? 18)}{" "}
                    {tokenInfo?.symbol}
                  </div>
                </div>
              </Info> */}
            </Row>
            <Info>
              <h3>From</h3>
              <div>
                <Logo
                  src={CHAINS[deposit.fromChain].logoURI}
                  alt={`${CHAINS[deposit.fromChain].name} logo`}
                />
                <div>
                  <SecondaryLink
                    href={`${CHAINS[deposit.fromChain].explorerUrl}/address/${
                      deposit.from
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {deposit.from}
                  </SecondaryLink>
                </div>
              </div>
            </Info>
            <Info>
              <h3>To</h3>
              <div>
                <Logo
                  src={CHAINS[deposit.toChain].logoURI}
                  alt={`${CHAINS[deposit.toChain].name} logo`}
                />
                <div>
                  <SecondaryLink
                    href={`${CHAINS[deposit.toChain].explorerUrl}/address/${
                      deposit.toAddress
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {deposit.toAddress}
                  </SecondaryLink>
                </div>
              </div>
            </Info>
            <Info>
              <h3>Estimated time of arrival</h3>
              <div>
                <div>~2 minutes</div>
              </div>
            </Info>
          </div>
          <Button onClick={() => toggle({ showConfirmationScreen: false })}>
            Close
          </Button>
        </InfoSection>
      </Wrapper>
    </Layout>
  );
};

export default Confirmation;
