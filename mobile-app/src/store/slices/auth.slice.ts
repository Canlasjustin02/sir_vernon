import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as authService from "../../services/auth/authService";
import { AuthUser, LoginResponse, RegisterData } from "../../types/auth.types";
import { getApiBaseUrlLabel } from "../../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const apiUrl = getApiBaseUrlLabel();

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return `The server took too long to respond (${apiUrl}). Check that the backend is running, your phone and PC are on the same network, firewall allows port 5000, and restart Expo with "npx expo start -c" after .env changes.`;
    }

    if (!error.response) {
      return `Cannot reach the server (${apiUrl}). Check your connection and mobile API URL.`;
    }

    const message = error.response.data?.message;
    return typeof message === "string" ? message : fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

interface LoginPayload {
  email: string;
  password: string;
  expectedRole?: "CUSTOMER" | "OWNER";
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>(
  "auth/login",
  async ({ email, password, expectedRole }, thunkAPI) => {
    try {
      const result = await authService.login(email, password);

      const loggedRole = result.user?.role?.toUpperCase();
      const isExpectedRole =
        expectedRole === "OWNER"
          ? loggedRole === "ADMIN" || loggedRole === "STAFF"
          : !expectedRole || expectedRole === loggedRole;

      if (!isExpectedRole) {
        return thunkAPI.rejectWithValue(
          `This account is not a ${expectedRole?.toLowerCase()} account.`
        );
      }

      await authService.persistSession(result);
      return result;
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(getAuthErrorMessage(error, "Login failed"));
    }
  }
);

export const registerUser = createAsyncThunk<
  AuthUser,
  RegisterData,
  { rejectValue: string }
>("auth/register", async (data, thunkAPI) => {
  try {
    const user = await authService.register(data);
    return user;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getAuthErrorMessage(error, "Register failed"));
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await authService.logout();
});

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, thunkAPI) => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        AsyncStorage.getItem("accessToken"),
        AsyncStorage.getItem("refreshToken"),
        AsyncStorage.getItem("user"),
      ]);

      if (accessToken && userJson) {
        try {
          return {
            user: JSON.parse(userJson),
            accessToken,
            refreshToken,
          };
        } catch (e) {
          console.error("Failed to parse user session data", e);
          return thunkAPI.rejectWithValue("Invalid session data");
        }
      }

      return thunkAPI.rejectWithValue("No session found");
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Failed to restore session");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken ?? null;
          state.isAuthenticated = true;
          state.error = null;
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      // Restore Session
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, updateUser } = authSlice.actions;
export default authSlice.reducer;