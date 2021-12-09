import styled from "@emotion/styled";

export const Wrapper = styled.div`
  min-height: 80%;
  flex: 1;
  background-color: var(--color-primary);
  border-radius: 12px 12px 0 0;
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
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  padding: 8px 16px;
`;

export const ROIItem = styled.div`
  flex-basis: 50%;
  color: var(--color-gray);
  font-size: ${16 / 16}rem;
  align-content: space-between;
  &:nth-of-type(2) {
    text-align: right;
  }
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
  background-color: var(--color-white);
  border-radius: 16px;
  padding: 4px;
  margin-top: 12px;
`;

export const TabContentWrapper = styled.div`
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  background-color: var(--color-gray);
  padding: 32px 16px;
`;

export const PositionWrapper = styled.div`
  background-color: var(--color-white-transparent);
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  padding: 16px;
  border-radius: 5px;
`;

export const PositionBlock = styled.div`
  display: flex;
  text-align: left;
`;

export const PositionBlockItem = styled.div`
  flex-basis: 50%;
  color: var(--color-gray);
  font-size: 16px;
  align-content: space-between;
  font-weight: 400;
  margin: 8px 0;
  &:nth-of-type(2) {
    text-align: right;
  }
`;

export const PositionBlockItemBold = styled(PositionBlockItem)`
  font-weight: 700;
`;
