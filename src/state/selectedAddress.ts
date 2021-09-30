import { createSlice } from "@reduxjs/toolkit";
import { connect, disconnect, update } from "./connection";

const initialState = "";
export const selectedAddressSlice = createSlice({
  name: "selectedAddress",
  initialState,
  reducers: {
    set: (state, action) => {
      state = action.payload;
      return state;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(connect, (state, action) => {
        state = action.payload.account;
        return state;
      })
      .addCase(update, (state, action) => {
        state = action.payload.account || state;
        return state;
      })
      .addCase(disconnect, () => initialState),
});

const { actions, reducer } = selectedAddressSlice;
// Extract and export each action creator by name
export const { set } = actions;
// Export the reducer, either as a default or named export
export default reducer;
