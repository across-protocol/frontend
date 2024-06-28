import styled from "@emotion/styled";
import GenericCard from "./GenericCard";
import { QUERIESV2, isDefined, rewardProgramTypes } from "utils";
import { Text } from "components";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { Tooltip } from "components/Tooltip";

export type GenericRewardInformationRowType = {
  title: string;
  tooltip?: string;
  value: string;
  prefix?: React.ReactNode;
  extendedPrefixSpacing?: boolean;
  prefixArrow?: boolean;
  prefixIcon?: "info";
  prefixIconTooltip?: {
    title: string;
    content: string;
  };
};

const GenericInformationCard = ({
  rows,
  program,
}: {
  rows: GenericRewardInformationRowType[];
  program: rewardProgramTypes;
}) => (
  <GenericCard program={program}>
    <RowContainer elements={rows.length}>
      {rows.map(
        (
          {
            title,
            tooltip,
            value,
            prefix,
            extendedPrefixSpacing,
            prefixArrow,
            prefixIcon,
            prefixIconTooltip,
          },
          idx
        ) => (
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
            {
              <ValueWithPrefixStack
                extendedPrefixSpacing={extendedPrefixSpacing}
                hasPrefix={isDefined(prefix)}
              >
                {prefix && (
                  <>
                    <PrefixIconPrefixStack>
                      {prefixIcon === "info" &&
                        (prefixIconTooltip ? (
                          <Tooltip
                            tooltipId={`prefix-info-tooltip-${idx}-${program}`}
                            body={prefixIconTooltip.content}
                            title={prefixIconTooltip.title}
                            icon={prefixIcon}
                            placement="bottom-start"
                          >
                            <InfoIcon />
                          </Tooltip>
                        ) : (
                          <InfoIcon />
                        ))}
                      <Text color="grey-400">{prefix}</Text>
                    </PrefixIconPrefixStack>
                    {prefixArrow && <ArrowIcon color="grey-400">←</ArrowIcon>}
                  </>
                )}
                <Text color="white">{value}</Text>
              </ValueWithPrefixStack>
            }
          </Row>
        )
      )}
    </RowContainer>
  </GenericCard>
);

export default GenericInformationCard;

const RowContainer = styled.div<{ elements: number }>`
  display: grid;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;

  @media ${QUERIESV2.tb.andDown} {
    grid-template-columns: repeat(
      ${({ elements }) => Math.min(elements, 4)},
      1fr
    );
    row-gap: 24px;
    grid-template-rows: repeat(
      ${({ elements }) => Math.ceil(elements / 4)},
      1fr
    );
  }

  @media ${QUERIESV2.sm.andDown} {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
  }
`;

const TitleWithTooltipStack = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ValueWithPrefixStack = styled.div<{
  extendedPrefixSpacing?: boolean;
  hasPrefix?: boolean;
}>`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${({ extendedPrefixSpacing }) => (extendedPrefixSpacing ? 12 : 8)}px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column-reverse;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
  }

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
    width: ${({ hasPrefix }) => (hasPrefix ? "100%" : "auto")};
  }
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

const ArrowIcon = styled(Text)`
  @media ${QUERIESV2.tb.andDown} {
    display: none;
  }
`;
