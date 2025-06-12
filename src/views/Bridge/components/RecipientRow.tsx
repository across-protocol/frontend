import styled from "@emotion/styled";
import { ReactComponent as EditIcon } from "assets/icons/edit.svg";

import { VoidHandler, shortenAddress, getEcosystem } from "utils";
import { Text } from "components";
import { Tooltip } from "components/Tooltip";
import { useEnsQuery } from "hooks/useEns";

import { ToAccount } from "../hooks/useToAccount";

type Props = {
  recipient?: ToAccount;
  toChainId: number;
  onClickChangeToAddress: VoidHandler;
};

export function RecipientRow(props: Props) {
  const ecosystem = getEcosystem(props.toChainId);

  const ensCols =
    ecosystem === "evm" && props.recipient?.address ? (
      <EnsData evmAddress={props.recipient?.address} />
    ) : null;

  const recipientAddress = props.recipient?.address;
  const isRecipientSet = !!recipientAddress;

  return (
    <Wrapper>
      <Text color="grey-400">Address:</Text>
      {ensCols}
      <Tooltip
        tooltipId="recipient-address-bridge-form"
        body={
          <Text size="xs">
            {isRecipientSet
              ? recipientAddress
              : `Connect ${
                  ecosystem === "evm" ? "an Ethereum" : "a Solana"
                } wallet or manually set a valid recipient address`}
          </Text>
        }
      >
        <Text color={"light-200"}>
          {isRecipientSet
            ? shortenAddress(recipientAddress, "...", 4)
            : "Connect or set recipient"}
        </Text>
      </Tooltip>
      <EditIconStyled onClick={props.onClickChangeToAddress} />
    </Wrapper>
  );
}

function EnsData(props: { evmAddress: string }) {
  const { data } = useEnsQuery(props.evmAddress);

  return (
    <>
      {data?.avatar && <img src={data.avatar} alt="avatar" />}
      {data?.ensName && <Text>{data.ensName}</Text>}
    </>
  );
}

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;

  > img {
    height: 16px;
    width: 16px;
    border-radius: 50%;
  }
`;

const EditIconStyled = styled(EditIcon)`
  cursor: pointer;
`;
