import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Transfer = {
  txHash: string;
  fromChain: number;
  toChain: number;
  fromAddress: string;
  toAddress: string;
  asset: string;
  amount: string;
};

// Save transfers, keyed by txHash
type TransferState = {
  showLatestTransfer: boolean;
  transfers: Transfer[];
  latestTransfer?: Transfer;
};

const initialState: TransferState = {
  showLatestTransfer: false,
  transfers: [],
};

const transfersSlice = createSlice({
  name: "transfers",
  initialState,
  reducers: {
    transfer: (state, action: PayloadAction<Transfer>) => {
      state.transfers.push(action.payload);
      state.latestTransfer = action.payload;
      return state;
    },
    toggle: (state) => {
      state.showLatestTransfer = !state.showLatestTransfer;
      return state;
    },
  },
});

const { actions, reducer } = transfersSlice;
// Extract and export each action creator by name
export const { transfer, toggle } = actions;
// Export the reducer, either as a default or named export
export default reducer;
