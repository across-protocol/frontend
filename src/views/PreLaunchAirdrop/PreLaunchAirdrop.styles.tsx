import styled from "@emotion/styled";
import Background from "assets/prelaunch-background.png";

export const Wrapper = styled.div`
  background: url(${Background});
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;

  display: flex;
  justify-content: space-between;
  flex-direction: column;

  min-height: calc(100vh);
  margin-top: -72px;
  padding-top: 72px;
`;

export const ContentWrapper = styled.div``;
