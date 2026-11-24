import User from "../../database/models/User.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, } from "../../utils/jwt.js";
import ApiError from "../../core/apiError.js";
import { sendSms } from "../../utils/smsService.js";
const createUser = async ({ name, email, telephone, address, password }, role) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
        throw new ApiError(409, "Email is already in use");
    const hashed = await hashPassword(password);
    const user = await User.create({
        name,
        email: normalizedEmail,
        telephone,
        address,
        password: hashed,
        role,
    });
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;
    return userData;
};
export const register = (input) => createUser(input, "CUSTOMER");
export const registerOwner = async (input) => {
    return await createUser(input, "ADMIN");
};
export const login = async ({ email, password }) => {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
        throw new ApiError(401, "Invalid email or password");
    if (!user.isActive)
        throw new ApiError(403, "Account is disabled");
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
        throw new ApiError(401, "Invalid email or password");
    const payload = {
        id: user._id.toString(),
        role: user.role,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    user.refreshToken = refreshToken;
    await user.save();
    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;
    return { user: userData, accessToken, refreshToken };
};
export const refreshToken = async ({ refreshToken }) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    }
    catch {
        throw new ApiError(401, "Invalid refresh token");
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive)
        throw new ApiError(401, "User not found or inactive");
    if (user.refreshToken !== refreshToken)
        throw new ApiError(401, "Refresh token does not match");
    const payload = {
        id: user._id.toString(),
        role: user.role,
    };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    user.refreshToken = newRefreshToken;
    await user.save();
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
export const logout = async (userId) => {
    const user = await User.findById(userId);
    if (!user)
        throw new ApiError(404, "User not found");
    user.refreshToken = null;
    await user.save();
    return true;
};
export const sendForgotPasswordOtp = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        return true;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    user.otp = otp;
    user.otpExpiresAt = expiresAt;
    await user.save();
    await sendSms(user.telephone, `Your password reset OTP is ${otp}. Valid for 10 minutes.`);
    return true;
};
export const verifyOtp = async (email, otp) => {
    const user = await User.findOne({
        email,
        otp,
        otpExpiresAt: { $gt: new Date() }
    });
    if (!user)
        throw new ApiError(400, "Invalid or expired OTP");
    return true;
};
export const resetPassword = async (email, otp, newPassword) => {
    const user = await User.findOne({
        email,
        otp,
        otpExpiresAt: { $gt: new Date() }
    });
    if (!user)
        throw new ApiError(400, "Invalid or expired OTP");
    const hashed = await hashPassword(newPassword);
    user.password = hashed;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    return true;
};
