import styled from "@emotion/styled";
import { BaseHeadCell } from "components/Table";

const rawHeader = [
  "Pool",
  "Staked LP Tokens",
  {
    header: "Multiplier",
    tooltip: {
      title: "Multiplier",
      description: "Lorem Ipsum",
    },
  },
  {
    header: "Reward APY",
    tooltip: {
      title: "Multiplier",
      description: "Lorem Ipsum",
    },
  },
  {
    header: "Age of Capital",
    tooltip: {
      title: "Age of Capital",
      description: "Lorem Ipsum",
    },
  },
  "Rewards",
  "",
];

export const headers = rawHeader.map((header) => ({
  value: <BaseHeadCell>HI</BaseHeadCell>,
}));

const Cell = styled(BaseHeadCell)<{ length: number }>`
  flex: 0 0 ${({ length }) => length}px;
`;

//   {
//     value: <AssetHeadCell>Pool</AssetHeadCell>,
//   },
//   {
//     value: "Staked LP Tokens",
//   },
//   {
//     value: (
//       <>
//         Multiplier <CircleInfo />
//       </>
//     ),
//   },
//   {
//     value: "Reward APY",
//   },
//   {
//     value: (
//       <>
//         Age of capital <CircleInfo />
//       </>
//     ),
//   },
//   {
//     value: "Rewards",
//   },
//   {
//     value: " ",
//   },
// ];
