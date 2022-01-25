import styled from "@emotion/styled";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  min-height: 80%;
  flex: 1;
  background-color: var(--color-primary);
  border-radius: 12px 12px 0 0;
  padding: 0 10px;
  @media ${QUERIES.tabletAndUp} {
    padding: 0 30px;
  }
`;

export const Info = styled.div`
  text-align: center;
`;
export const InfoText = styled.h3`
  font-size: ${24 / 16}rem;
  color: var(--color-gray);
  margin-bottom: 16px;
`;

export const ROIWrapper = styled.div`
  margin-top: 8px;
  text-align: left;
  display: flex;
  margin-left: auto;
  margin-right: auto;
  padding: 8px 16px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
  background-color: var(--color-white);
  border-radius: 16px;
  margin-top: 12px;
`;

export const TabContentWrapper = styled.div`
  background-color: var(--color-gray);
  padding: 20px;
  padding-bottom: 40px;
`;

export const Position = styled.div`
  background-color: var(--color-white-transparent);
  border-radius: 5px;
  padding: 15px;
  color: var(--color-gray);
  margin-bottom: 5px;
`;

export const PositionItem = styled.div`
  display: flex;
  justify-content: space-between;
  &:not(:last-of-type) {
    margin-bottom: 15px;
  }
  &:last-of-type {
    font-weight: 700;
  }
`;

export const ROI = styled.div`
  color: var(--color-gray);
  padding: 15px;
`;

export const ROIItem = styled.div`
  display: flex;
  justify-content: space-between;
  &:not(:last-of-type) {
    margin-bottom: 15px;
  }
`;
