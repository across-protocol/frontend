import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { PaginatedDepositsTable } from "../components/DepositsTable";
import { Deposit } from "../hooks/useDeposits";

const mockedDeposits: Deposit[] = [
  {
    depositId: 1180880,
    depositTime: 1698275877,
    status: "pending",
    filled: "0",
    sourceChainId: 324,
    destinationChainId: 42161,
    assetAddr: "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91",
    depositorAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    recipientAddr: "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A",
    message: "0x",
    amount: "50000000000000000",
    depositTxHash:
      "0x13a619b510e643d51f74f5a01f98c16161e1d93c2db6f689478472a3f42ec7e0",
    fillTxs: [],
    speedUps: [],
    depositRelayerFeePct: "4952678372124980",
    initialRelayerFeePct: "4952678372124980",
    suggestedRelayerFeePct: "4952678372124980",
  },
  // Fee too low, i.e. unprofitable
  {
    depositId: 1144678,
    depositTime: 1696447947,
    status: "pending",
    filled: "0",
    sourceChainId: 42161,
    destinationChainId: 324,
    assetAddr: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    depositorAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    recipientAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    message: "0x",
    amount: "2000000000000000000000",
    depositTxHash:
      "0x66a7c4e34f91325d0c17bc7bb98350e15c61166d6138a0e89e002637b36fe3e5",
    fillTxs: [],
    speedUps: [],
    depositRelayerFeePct: "0",
    initialRelayerFeePct: "0",
    suggestedRelayerFeePct: "156172500000000000",
  },
  // Finalized with fill time
  {
    depositId: 1205910,
    depositTime: 1698998623,
    fillTime: 1698998623 + 99,
    status: "filled",
    filled: "12000000",
    sourceChainId: 324,
    destinationChainId: 8453,
    assetAddr: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
    depositorAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    recipientAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    message: "0x",
    amount: "12000000",
    depositTxHash:
      "0xe8a2d8ed449a6a2fe7fa3dc24e699a951f945280c27df259a910008683b1e296",
    fillTxs: [
      "0x8caf6a0e38a8788f47dfad89e709f1c0854783987558af9c34d0fadb61c20941",
    ],
    speedUps: [],
    depositRelayerFeePct: "24394417866666666",
    initialRelayerFeePct: "24394417866666666",
    suggestedRelayerFeePct: "28289667866666666",
  },
  // Finalized without fill time
  {
    depositId: 1199308,
    depositTime: 1698831959,
    status: "filled",
    filled: "12000000",
    sourceChainId: 42161,
    destinationChainId: 8453,
    assetAddr: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    depositorAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    recipientAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    message: "0x",
    amount: "12000000",
    depositTxHash:
      "0x4eecaeee9b6d2df9d06d249b99ce042dd16dbf7bf2fd5d0cc6938e336fdaadd3",
    fillTxs: [
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806a",
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806b",
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806c",
    ],
    speedUps: [],
    depositRelayerFeePct: "28434751200000000",
    initialRelayerFeePct: "28434751200000000",
    suggestedRelayerFeePct: "28443917866666666",
    feeBreakdown: {
      lpFeeUsd: "341217014400000000",
      lpFeePct: "28434751200000000",
      lpFeeAmount: "341217014400000000",
      relayCapitalFeeUsd: "341217014400000000",
      relayCapitalFeePct: "28434751200000000",
      relayCapitalFeeAmount: "341217014400000000",
      relayGasFeeUsd: "341217014400000000",
      relayGasFeePct: "28434751200000000",
      relayGasFeeAmount: "341217014400000000",
      totalBridgeFeeUsd: "341217014400000000",
      totalBridgeFeePct: "28434751200000000",
      totalBridgeFeeAmount: "341217014400000000",
    },
    rewards: {
      type: "referrals",
      rate: 0.4,
      tier: 1,
      amount: "341217014400000000",
      usd: "341217014400000000",
    },
  },
  {
    depositId: 1199309,
    depositTime: 1698831959,
    status: "filled",
    filled: "12000000",
    sourceChainId: 42161,
    destinationChainId: 8453,
    assetAddr: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    depositorAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    recipientAddr: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
    message: "0x",
    amount: "12000000",
    depositTxHash:
      "0x4eecaeee9b6d2df9d06d249b99ce042dd16dbf7bf2fd5d0cc6938e336fdaadd3",
    fillTxs: [
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806a",
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806b",
      "0xb88ad8d998f0b453c351b0415475e197847e73911bcfb41cab2ee9b0ceb4806c",
    ],
    speedUps: [],
    depositRelayerFeePct: "28434751200000000",
    initialRelayerFeePct: "28434751200000000",
    suggestedRelayerFeePct: "28443917866666666",
    feeBreakdown: {
      lpFeeUsd: "341217014400000000",
      lpFeePct: "28434751200000000",
      lpFeeAmount: "341217014400000000",
      relayCapitalFeeUsd: "341217014400000000",
      relayCapitalFeePct: "28434751200000000",
      relayCapitalFeeAmount: "341217014400000000",
      relayGasFeeUsd: "341217014400000000",
      relayGasFeePct: "28434751200000000",
      relayGasFeeAmount: "341217014400000000",
      totalBridgeFeeUsd: "341217014400000000",
      totalBridgeFeePct: "28434751200000000",
      totalBridgeFeeAmount: "341217014400000000",
    },
    rewards: {
      type: "referrals",
      rate: 0.4,
      tier: 1,
      amount: "341217014400000000",
      usd: "341217014400000000",
    },
  },
];

const meta: Meta<typeof PaginatedDepositsTable> = {
  component: PaginatedDepositsTable,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof PaginatedDepositsTable>;

const BasicPagination = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(1);
  const [deposits, setDeposits] = useState<Deposit[]>(
    mockedDeposits.slice(0, 1)
  );

  return (
    <PaginatedDepositsTable
      deposits={deposits}
      currentPage={currentPage}
      onPageChange={(page) => {
        setCurrentPage(page);
        setDeposits(mockedDeposits.slice(page, page + pageSize));
      }}
      currentPageSize={pageSize}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setDeposits(mockedDeposits.slice(0, size));
      }}
      totalCount={mockedDeposits.length}
      pageSizes={[1, 2, 3]}
      initialPageSize={pageSize}
    />
  );
};

export const Default: Story = {
  render: () => <BasicPagination />,
};
