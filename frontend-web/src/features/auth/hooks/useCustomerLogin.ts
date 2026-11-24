import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../../../services/storage/tokenStorage";
import { userStorage } from "../../../services/storage/userStorage";
import { useAppDispatch } from "../../../store/hooks";
import { loginSuccess } from "../../../store/slices/auth.slice";
import type { LoginRequest } from "../types";

export function useCustomerLogin() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = async (payload: LoginRequest) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login(payload);
      if (response.user.role !== "CUSTOMER") {
        setError("This is not a customer account. Use the owner / staff login.");
        return false;
      }

      tokenStorage.set(response.accessToken, response.refreshToken);
      userStorage.set(response.user);
      dispatch(
        loginSuccess({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );
      toast.success("Welcome back!");
      navigate("/customer/account", { replace: true });
      return true;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to sign in";
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { login, submitting, error };
}
