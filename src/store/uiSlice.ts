// src/store/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UiState = {
  adminView: boolean;
  globalSettingsView: boolean;
};

const initialState: UiState = {
  adminView: false,
  globalSettingsView: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setAdminView(state, action: PayloadAction<boolean>) {
      if (state.globalSettingsView == true && action.payload == true)
        state.globalSettingsView = false;
      state.adminView = action.payload;
    },
    toggleAdminView(state) {
      if (state.globalSettingsView == true && state.adminView == false)
        state.globalSettingsView = false;
      state.adminView = !state.adminView;
    },
    setGlobalSettingsView(state, action: PayloadAction<boolean>) {
      if (state.adminView == true && action.payload == true)
        state.adminView = false;
      state.globalSettingsView = action.payload;
    },
    toggleGlobalSettingsView(state) {
      if (state.adminView == true && state.globalSettingsView == false)
        state.adminView = false;
      state.globalSettingsView = !state.globalSettingsView;
    },
  },
});

export const {
  setAdminView,
  toggleAdminView,
  setGlobalSettingsView,
  toggleGlobalSettingsView,
} = uiSlice.actions;
export default uiSlice.reducer;
