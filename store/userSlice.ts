import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice } from "@reduxjs/toolkit";

type UserState = {
  data: any | null;
  loading: boolean;
};

const initialState: UserState = {
  data: null,
  loading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.data = action.payload;
      state.loading = false;
      AsyncStorage.setItem("user", JSON.stringify(action.payload));
    },
    hydrateUser(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.data = null;
      state.loading = false;
      AsyncStorage.removeItem("user");
    },
  },
});

export const { setUser, hydrateUser, logout } = userSlice.actions;
export default userSlice.reducer;
