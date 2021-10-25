import { createSlice } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { toChain } from "./send";

type State = {
  block?: ethers.providers.Block & { blockNumber: number };
};
const initialState: State = {};
const blockSlice = createSlice({
  name: "block",
  initialState,
  reducers: {
    setBlock: (state, action) => {
      state.block = action.payload;
      return state;
    },
  },
  extraReducers: (builder) =>
    builder.addCase(toChain, (state) => {
      state = initialState;
      return state;
    }),
});

const { actions, reducer } = blockSlice;
// Extract and export each action creator by name
export const { setBlock } = actions;
// Export the reducer, either as a default or named export
export default reducer;
