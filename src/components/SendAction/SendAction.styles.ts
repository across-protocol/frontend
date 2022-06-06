import styled from "@emotion/styled";
import { BaseButton } from "components/Buttons";
import { COLORS, QUERIES } from "utils";
import { AccentSection as UnstyledAccentSection } from "../Section";

export const AccentSection = styled(UnstyledAccentSection)`
  position: relative;
`;

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 40px 0 65px;
`;

export const InfoHeadlineContainer = styled.div`
  padding: 0 15px 0 0;
  margin: 0 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
  font-size: ${14 / 16}rem;
  line-height: ${17 / 16}rem;
  font-weight: 400;
  color: var(--color-white);
`;

export const SlippageDisclaimer = styled.div`
  display: flex;
  align-items: center;

  svg {
    margin-right: 15px;
    width: 26px;
  }

  @media ${QUERIES.tabletAndUp} {
    svg {
      width: 32px;
    }
  }
`;

export const FeesButton = styled(BaseButton)`
  padding: 0;
  font: inherit;
  color: var(--color-primary);
`;

export const InfoContainer = styled.div`
  padding: 10px 15px;
  background-color: hsla(${COLORS.gray[500]} / 0.75);
  border-radius: 5px;
  font-size: ${14 / 16}rem;
  line-height: ${17 / 16}rem;
  font-weight: 400;
  color: var(--color-white-transparent);
`;

export const Info = styled.div`
  display: flex;
  justify-content: space-between;

  &:not(:last-of-type) {
    margin-bottom: 6px;
  }
`;

export const AmountToReceive = styled.div`
  padding: 0 15px;
  margin: 10px 0 25px;
  display: flex;
  justify-content: space-between;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 600;
  color: var(--color-white);

  span {
    font: inherit;
  }
`;

export const PendingTxWrapper = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  text-align: center;
  a {
    margin: 8px auto 0;
    color: var(--color-primary);
    cursor: pointer;
  }
`;
