import styled from "@emotion/styled";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
  box-sizing: border-box;
`;

export const Tabs = styled.div`
  display: flex;
  justify-content: center;
  width: calc(100% - 50px);
  margin: 0 auto;
  justify-items: center;
`;

interface ITab {
  active: boolean;
}
export const Tab = styled.div<ITab>`
  flex-grow: 1;
  font-family: "Barlow";
  font-style: normal;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  color: #e0f3ff;
  text-align: center;
  padding: 24px 0 20px;
  border-bottom: ${(props) =>
    props.active ? "2px solid #e0f3ff" : "2px solid transparent"};
  cursor: pointer;
`;
