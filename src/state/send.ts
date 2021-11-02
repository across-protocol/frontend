import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { update } from "./connection";
import { toggle as toggleConfirmationScreen } from "./deposits";

import { ChainId, DEFAULT_FROM_CHAIN_ID, DEFAULT_TO_CHAIN_ID } from "utils";

type State = {
  token: string;
  amount: ethers.BigNumber;
  toChain: ChainId;
  fromChain: ChainId;
  toAddress?: string;
  error?: Error;
};

const initialState: State = {
  token: ethers.constants.AddressZero,
  amount: ethers.constants.Zero,
  toChain: DEFAULT_TO_CHAIN_ID,
  fromChain: DEFAULT_FROM_CHAIN_ID,
};

const sendSlice = createSlice({
  name: "send",
  initialState,
  reducers: {
    token: (state, action: PayloadAction<Pick<State, "token">>) => {
      state.token = action.payload.token;
      return state;
    },
    amount: (state, action: PayloadAction<Pick<State, "amount">>) => {
      state.amount = action.payload.amount;
      return state;
    },
    toChain: (state, action: PayloadAction<Pick<State, "toChain">>) => {
      state.toChain = action.payload.toChain;
      return state;
    },
    fromChain: (state, action: PayloadAction<Pick<State, "fromChain">>) => {
      state.fromChain = action.payload.fromChain;
      return state;
    },
    toAddress: (
      state,
      action: PayloadAction<Required<Pick<State, "toAddress">>>
    ) => {
      state.toAddress = action.payload.toAddress;
      return state;
    },
    error: (state, action: PayloadAction<Pick<State, "error">>) => {
      state.error = action.payload.error;
      return state;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(update, (state, action) => {
        state.toAddress = action.payload.account ?? state.toAddress;
        return state;
      })
      .addCase(toggleConfirmationScreen, (state, action) => {
        // If the confirmation screen is closed, reset the state.
        if (action.payload.showConfirmationScreen === false) {
          state = initialState;
        }
        return state;
      }),
});

const { actions, reducer } = sendSlice;
// Extract and export each action creator by name
export const { token, amount, fromChain, toChain, toAddress, error } = actions;
// Export the reducer, either as a default or named export
export default reducer;
