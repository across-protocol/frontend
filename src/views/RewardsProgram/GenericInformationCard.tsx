import GenericCard from "./GenericCard";

export type GenericRewardInformationRowType = {
  title: string;
  tooltip?: string;
  value: string;
  suffix?: React.ReactNode;
};

const GenericInformationCard = ({
  rows,
}: {
  rows: GenericRewardInformationRowType[];
}) => <GenericCard program={"referrals"}>hi</GenericCard>;

export default GenericInformationCard;
