import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    userId: "demoUser",
    displayName: "Demo User",
  },
  reducers: {
    logInUser(state, action) {
      state.userId = action.payload.uid;
      state.displayName = action.payload.displayName;
    },
  },
});

export default authSlice.reducer;
