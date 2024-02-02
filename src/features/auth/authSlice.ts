import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    userId: "demoUser",
  },
  reducers: {},
});

export default authSlice.reducer;
