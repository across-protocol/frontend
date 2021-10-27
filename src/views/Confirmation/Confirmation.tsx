import React from "react";
import { Check, ArrowUpRight } from "react-feather";
import { TOKENS_LIST, CHAINS, formatUnits } from "utils";
import { useDeposits } from "state/hooks";
import { Layout } from "components";
import {
  Wrapper,
  Heading,
  SuccessIcon,
  Link,
  Info,
  Button,
  Logo,
  InfoSection,
  Header,
} from "./Confirmation.styles";

const Confirmation: React.FC = () => {
  const { deposit, toggle } = useDeposits();
  if (!deposit) return null;

  const tokenInfo = TOKENS_LIST[deposit.fromChain].find(
    (t) => t.address === deposit.token
  );

  return (
    <Layout>
      <Wrapper>
        <Header>
          <Heading>Deposit succeeded</Heading>
          <SuccessIcon>
            <Check strokeWidth={4} />
          </SuccessIcon>
        </Header>
        <InfoSection>
          <Link
            href={CHAINS[deposit.fromChain].constructExplorerLink(
              deposit.txHash
            )}
            target="_blank"
            rel="noopener norefferrer"
          >
            Explorer <ArrowUpRight width={16} height={16} />
          </Link>
          <div>
            <Info>
              <h3>Sending</h3>
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
            <Info>
              <h3>From</h3>
              <div>
                <Logo
                  src={CHAINS[deposit.fromChain].logoURI}
                  alt={`${CHAINS[deposit.fromChain].name} logo`}
                />
                <div>{deposit.from}</div>
              </div>
            </Info>
            <Info>
              <h3>To</h3>
              <div>
                <Logo
                  src={CHAINS[deposit.toChain].logoURI}
                  alt={`${CHAINS[deposit.toChain].name} logo`}
                />
                <div>{deposit.to}</div>
              </div>
            </Info>
            <Info>
              <h3>ETA to {CHAINS[deposit.toChain].name}</h3>
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
