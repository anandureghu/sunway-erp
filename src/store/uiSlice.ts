// src/store/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  adminView: boolean;
};

const initialState: UiState = {
  adminView: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setAdminView(state, action: PayloadAction<boolean>) {
      state.adminView = action.payload;
    },
    toggleAdminView(state) {
      state.adminView = !state.adminView;
    },
  },
});

export const { setAdminView, toggleAdminView } = uiSlice.actions;
export default uiSlice.reducer;
