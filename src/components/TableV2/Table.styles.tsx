import styled from "@emotion/styled";

export const BaseWrapper = styled.div`
  margin: auto;
  padding: ${64 / 16}rem 0 0;

  @media (max-width: 1024px) {
    padding: ${48 / 16}rem 0 0;
  }

  @media (max-width: 428px) {
    padding: ${32 / 16}rem 0 0;
  }
`;

export const BaseTitle = styled.h2`
  margin: 0 ${16 / 16}rem ${16 / 16}rem;
  color: #e0f3ff;
  font-size: ${18 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;

  @media (max-width: 428px) {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
  }
`;

export const BaseTableWrapper = styled.div<{ scrollable?: boolean }>`
  border: 1px solid #3e4047;
  border-radius: 8px;
  overflow-x: ${({ scrollable }) => (scrollable ? "auto" : "hidden")};

  ::-webkit-scrollbar {
    height: 0;
  }

  ::-webkit-scrollbar-track {
    background-color: var(--color-gray);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-600);
    border-radius: 6px;
    border: 2px solid #2d2e33;
  }
`;

export const BaseTableHeadRow = styled.div`
  display: flex;
`;

export const BaseTableBody = styled.div``;

export const BaseTableRow = styled.div`
  display: flex;
  position: relative;
  background-color: #2d2e33;
`;

export const BaseTableCell = styled.div`
  padding: ${15 / 16}rem 0 ${15 / 16}rem ${16 / 16}rem;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  white-space: nowrap;
  background-color: #2d2e33;
  border-top: 1px solid #3e4047;

  @media (max-width: 428px) {
    padding: ${13 / 16}rem 0 ${13 / 16}rem ${12 / 16}rem;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const BaseHeadCell = styled(BaseTableCell)`
  padding: ${10 / 16}rem 0 ${10 / 16}rem ${16 / 16}rem;
  color: #9daab2;
  background-color: #34353b;
  border: none;

  @media (max-width: 428px) {
    padding: ${7 / 16}rem 0 ${7 / 16}rem ${12 / 16}rem;
  }
`;

export const BaseEmptyRow = styled.div`
  padding: ${26 / 16}rem ${16 / 16}rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid #3f4047;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  color: #c5d5e0;

  @media (max-width: 428px) {
    padding: ${22 / 16}rem ${16 / 16}rem;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const AccordionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const AccordionRow = styled.div`
  display: flex;
  > div {
    padding: 8px 0;
  }
  > div:first-of-type {
    flex: 1 0 60px;
    background-color: var(--color-black);
    border-bottom: 1px solid #2c2f33;
    text-indent: 24px;
  }
  > div:nth-of-type(2) {
    flex: 3 0 130px;
    background: rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid #2c2f33;
    text-indent: 12px;
  }
  &:nth-of-type(6) > div {
    border-bottom: none;
  }
`;
