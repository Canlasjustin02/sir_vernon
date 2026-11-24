import * as authService from "./service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
export const register = asyncHandler(async (req, res) => {
    const { name, email, telephone, address, password } = req.body;
    const user = await authService.register({
        name,
        email,
        telephone,
        address,
        password,
    });
    return ApiResponse(res, 201, "User registered successfully", user);
});
export const registerOwner = asyncHandler(async (req, res) => {
    const user = await authService.registerOwner(req.body);
    return ApiResponse(res, 201, "Owner registered successfully", user);
});
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return ApiResponse(res, 200, "Login successful", result);
});
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken({ refreshToken });
    return ApiResponse(res, 200, "Token refreshed successfully", tokens);
});
export const logout = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return ApiResponse(res, 401, "Unauthorized");
    }
    await authService.logout(userId);
    return ApiResponse(res, 200, "Logged out successfully");
});
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.sendForgotPasswordOtp(email);
    return ApiResponse(res, 200, "If an account exists, an OTP will be sent to the registered phone number.");
});
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    await authService.verifyOtp(email, otp);
    return ApiResponse(res, 200, "OTP verified successfully");
});
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    return ApiResponse(res, 200, "Password reset successfully");
});
