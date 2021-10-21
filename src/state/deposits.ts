import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { ChainId } from "utils";

type Deposit = {
  txHash: string;
  amount: ethers.BigNumber;
  to: string;
  from: string;
  token: string;
  fromChain: ChainId;
  toChain: ChainId;
};
type State = {
  showConfirmationScreen: boolean;
  deposit?: Deposit;
  tx?: ethers.ContractReceipt;
};

const initialState: State = {
  showConfirmationScreen: false,
};

type DepositAction = PayloadAction<{
  tx: ethers.ContractReceipt;
  token: string;
  amount: ethers.BigNumber;
  fromChain: ChainId;
  toChain: ChainId;
}>;

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
      const depositTx = action.payload.tx;
      const amount = action.payload.amount;
      const fromChain = action.payload.fromChain;
      const toChain = action.payload.toChain;
      const from = depositTx.from;
      const to = depositTx.to;
      const token = action.payload.token;
      state.tx = depositTx;
      state.deposit = {
        txHash: depositTx.transactionHash,
        token,
        amount,
        to,
        from,
        fromChain,
        toChain,
      };
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
