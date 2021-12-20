import styled from "@emotion/styled";
import AccentSectionBorder from "assets/border.svg";

export const Section = styled.section`
  color: var(--color-white);
  border-bottom: 1px solid var(--color-primary-dark);
  padding: 10px 30px 25px;
`;
export const SectionTitle = styled.h3`
  font-weight: 700;
  padding-top: 5px;
`;
export const AccentSection = styled.section`
  padding: 0 30px;
  background-image: url(${AccentSectionBorder}),
    linear-gradient(var(--color-primary-dark), var(--color-gray));
  background-repeat: no-repeat, repeat;
  background-position: top -4px center, 0% 0%;
  border: 1px solid var(--color-gray);
`;
