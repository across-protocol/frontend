import styled from "@emotion/styled";

import BgUrl from "assets/bg-banners/empty-deposits-banner.svg";

type Props = {
  children?: React.ReactNode;
};

export function EmptyTable({ children }: Props) {
  return <Wrapper>{children}</Wrapper>;
}

const Wrapper = styled.div`
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-top: -24px;
  gap: 24px;

  background-image: url(${BgUrl});
`;
