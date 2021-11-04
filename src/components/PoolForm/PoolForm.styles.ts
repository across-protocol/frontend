import styled from "@emotion/styled";

export const Wrapper = styled.div`
  height: 100%;
  background-color: #6cf9d8;
  border-radius: 12px;
`;

export const Info = styled.div`
  text-align: center;
`;

export const InfoText = styled.h3`
  font-family: "Barlow";
  font-size: 1.5rem;
  color: hsla(231, 6%, 19%, 1);
  margin-bottom: 1rem;
`;

export const ROIWrapper = styled.div`
  margin-top: 0.5rem;
  text-align: left;
  display: flex;
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem;
`;

export const ROIItem = styled.div`
  flex-basis: 50%;
  color: hsla(231, 6%, 19%, 1);
  font-size: 1rem;
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
  background-color: #ffffff;
  border-radius: 16px;
  padding: 4px;
  margin-top: 12px;
`;

export const TabContentWrapper = styled.div`
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  background-color: #2d2e33;
  padding: 2rem 1rem;
`;

export const PositionWrapper = styled.div`
  background-color: hsla(0, 0%, 100%, 0.5);
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
  font-family: "Barlow";
  border-radius: 5px;
`;

export const PositionBlock = styled.div`
  display: flex;
  text-align: left;
`;

export const PositionBlockItem = styled.div`
  flex-basis: 50%;
  color: hsla(230, 6%, 19%, 1);
  font-size: 1rem;
  align-content: space-between;
  font-weight: 400;
  margin: 0.5rem 0;
  &:nth-of-type(2) {
    text-align: right;
  }
`;

export const PositionBlockItemBold = styled(PositionBlockItem)`
  font-weight: 700;
`;
