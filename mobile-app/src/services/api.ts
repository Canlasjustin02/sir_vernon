import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, API_ENDPOINTS } from "../constants/api";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

let refreshPromise: Promise<string | null> | null = null;

const isAuthRefreshRequest = (url?: string): boolean => {
  if (!url) return false;
  return url.includes(API_ENDPOINTS.AUTH.REFRESH) || url.includes("/auth/refresh-token");
};

const clearSessionAndLogout = async () => {
  await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
  try {
    const { store } = require("../store/store");
    store.dispatch({ type: "auth/logout/fulfilled" });
  } catch (e) {
    console.error("Failed to dispatch logout from interceptor", e);
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      { refreshToken },
      { timeout: API_CONFIG.TIMEOUT }
    );

    const data = response.data?.data ?? response.data;
    const accessToken: string | undefined = data?.accessToken;
    const newRefreshToken: string | undefined = data?.refreshToken;

    if (!accessToken) return null;

    await AsyncStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem("refreshToken", newRefreshToken);
    }

    return accessToken;
  })()
    .catch(async () => {
      await clearSessionAndLogout();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      await clearSessionAndLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
