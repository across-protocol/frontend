import styled from "@emotion/styled";
import GenericCard from "./GenericCard";
import { rewardProgramTypes } from "utils";
import { Text } from "components";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as ClockIcon } from "assets/icons/clock.svg";

export type GenericRewardInformationRowType = {
  title: string;
  tooltip?: string;
  value: string;
  prefix?: React.ReactNode;
  extendedPrefixSpacing?: boolean;
  prefixArrow?: boolean;
  prefixIcon?: "clock";
};

const GenericInformationCard = ({
  rows,
  program,
}: {
  rows: GenericRewardInformationRowType[];
  program: rewardProgramTypes;
}) => (
  <GenericCard program={program}>
    <RowContainer>
      {rows.map(
        ({
          title,
          tooltip,
          value,
          prefix,
          extendedPrefixSpacing,
          prefixArrow,
          prefixIcon,
        }) => (
          <Row key={title}>
            <TitleWithTooltipStack>
              <Text color="grey-400">{title}</Text>
              {tooltip && (
                <Tooltip body={tooltip} title={title} placement="bottom-start">
                  <InfoIconWrapper>
                    <InfoIcon />
                  </InfoIconWrapper>
                </Tooltip>
              )}
            </TitleWithTooltipStack>
            <ValueWithPrefixStack extendedPrefixSpacing={extendedPrefixSpacing}>
              {prefix && (
                <>
                  <PrefixIconPrefixStack>
                    {prefixIcon === "clock" && <ClockIcon />}
                    <Text color="grey-400">{prefix}</Text>
                  </PrefixIconPrefixStack>
                  {prefixArrow && <Text color="grey-400">←</Text>}
                </>
              )}
              <Text color="white">{value}</Text>
            </ValueWithPrefixStack>
          </Row>
        )
      )}
    </RowContainer>
  </GenericCard>
);

export default GenericInformationCard;

const RowContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

const TitleWithTooltipStack = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ValueWithPrefixStack = styled.div<{ extendedPrefixSpacing?: boolean }>`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ extendedPrefixSpacing }) => (extendedPrefixSpacing ? 12 : 8)}px;
`;

const InfoIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 16px;
  width: 16px;
`;

const PrefixIconPrefixStack = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
