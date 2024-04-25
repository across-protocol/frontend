import styled from "@emotion/styled";
import { ReactComponent as EditIcon } from "assets/icons/edit.svg";

import { VoidHandler, shortenAddress } from "utils";
import { Text } from "components";
import { Tooltip } from "components/Tooltip";
import { useEnsQuery } from "hooks/useEns";

import { ToAccount } from "../hooks/useToAccount";

type Props = {
  recipient: ToAccount;
  onClickChangeToAddress: VoidHandler;
};

export function RecipientRow(props: Props) {
  const { data } = useEnsQuery(props.recipient.address);

  return (
    <Wrapper>
      <Text color="grey-400">Address:</Text>
      {data?.avatar && <img src={data.avatar} alt="avatar" />}
      {data?.ensName && <Text>{data.ensName}</Text>}
      <Tooltip
        tooltipId="recipient-address-bridge-form"
        body={<Text size="xs">{props.recipient.address}</Text>}
      >
        <Text color={data?.ensName ? "grey-400" : "light-200"}>
          {shortenAddress(props.recipient.address, "...", 4)}
        </Text>
      </Tooltip>
      <EditIconStyled onClick={props.onClickChangeToAddress} />
    </Wrapper>
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
