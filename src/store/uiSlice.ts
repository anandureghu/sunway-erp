// src/store/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  globalSettingsView: boolean;
};

const initialState: UiState = {
  globalSettingsView: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalSettingsView(state, action: PayloadAction<boolean>) {
      state.globalSettingsView = action.payload;
    },
    toggleGlobalSettingsView(state) {
      state.globalSettingsView = !state.globalSettingsView;
    },
  },
});

export const { setGlobalSettingsView, toggleGlobalSettingsView } =
  uiSlice.actions;
export default uiSlice.reducer;
