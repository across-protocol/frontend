import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";

export enum TransactionTypes {
  APPROVE = "Approve",
  DEPOSIT = "Deposit",
}
export type Transaction = ethers.ContractTransaction & {
  meta?: {
    label: TransactionTypes;
  };
};
type State = Record<string, Transaction>;

const initialState: State = {};
const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    add: (state, action: PayloadAction<Transaction>) => {
      state[action.payload.hash] = action.payload;
      return state;
    },
  },
});

const { actions, reducer } = transactionsSlice;
// Extract and export each action creator by name
export const { add } = actions;
// Export the reducer, either as a default or named export
export default reducer;
