import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";

type State = {
  showConfirmationScreen: boolean;
  deposit?: ethers.ContractReceipt;
};

const initialState: State = {
  showConfirmationScreen: false,
};

type DepositAction = PayloadAction<{ deposit: ethers.ContractReceipt }>;

const connectionSlice = createSlice({
  name: "deposits",
  initialState,
  reducers: {
    toggle: (
      state,
      action: PayloadAction<Pick<State, "showConfirmationScreen">>
    ) => {
      state.showConfirmationScreen = action.payload.showConfirmationScreen;
      return state;
    },
    deposit: (state, action: DepositAction) => {
      const depositTx = action.payload.deposit;
      state.deposit = depositTx;
      state.showConfirmationScreen = true;
      return state;
    },
  },
});

const { actions, reducer } = connectionSlice;
// Extract and export each action creator by name
export const { toggle, deposit } = actions;
// Export the reducer, either as a default or named export
export default reducer;
