import React from "react";
import { Check, ArrowUpRight } from "react-feather";
import { TOKENS_LIST, CHAINS, formatUnits } from "utils";
import { useDeposits, useSend } from "state/hooks";
import { Layout, Section, AccentSection } from "components";
import {
  Wrapper,
  Heading,
  SuccessIcon,
  Link,
  Info,
  Button,
} from "./Confirmation.styles";

const Confirmation: React.FC = () => {
  const { deposit, toggle } = useDeposits();
  const { fromChain, toAddress, toChain, token, amount } = useSend();
  if (!deposit) return null;

  const tokenInfo = TOKENS_LIST[fromChain].find((t) => t.address === token);

  return (
    <Layout>
      <Wrapper>
        <Section>
          <Heading>Deposit succeeded</Heading>
          <SuccessIcon>
            <Check strokeWidth={4} />
          </SuccessIcon>
        </Section>
        <AccentSection>
          <Link
            href={CHAINS[fromChain].constructExplorerLink(
              deposit.transactionHash
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
                <img src="" alt={`${2} logo`} />
                <div>
                  {formatUnits(amount, tokenInfo?.decimals ?? 18)}{" "}
                  {tokenInfo?.symbol}
                </div>
              </div>
            </Info>
            <Info>
              <h3>From</h3>
              <div>
                <img
                  src={CHAINS[fromChain].logoURI}
                  alt={`${CHAINS[fromChain].name} logo`}
                />
                <div>{deposit.from}</div>
              </div>
            </Info>
            <Info>
              <h3>To</h3>
              <div>
                <img
                  src={CHAINS[toChain].logoURI}
                  alt={`${CHAINS[toChain].name} logo`}
                />
                <div>{toAddress}</div>
              </div>
            </Info>
            <Info>
              <h3>ETA to {CHAINS[fromChain].name}</h3>
              <div>
                <div>~2 minutes</div>
              </div>
            </Info>
          </div>
          <Button onClick={() => toggle({ showConfirmationScreen: false })}>
            Close
          </Button>
        </AccentSection>
      </Wrapper>
    </Layout>
  );
};

export default Confirmation;
