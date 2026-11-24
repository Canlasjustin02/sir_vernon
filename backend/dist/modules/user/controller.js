import * as service from './service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/apiResponse.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import ApiError from '../../core/apiError.js';
export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await service.getProfile(userId);
    return ApiResponse(res, 200, 'User profile fetched successfully', result);
});
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await service.updateProfile(userId, req.body);
    return ApiResponse(res, 200, 'User profile updated successfully', result);
});
export const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await service.changePassword(userId, req.body);
    return ApiResponse(res, 200, 'Password changed successfully');
});
export const deleteProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await service.softDeleteUser(userId);
    return ApiResponse(res, 200, 'Account deleted successfully', result);
});
export const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload an image file');
    }
    const userId = req.user.id;
    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'avatars');
    const result = await service.updateProfile(userId, { avatar: avatarUrl });
    return ApiResponse(res, 200, 'Avatar uploaded successfully', result);
});
export const getUsers = asyncHandler(async (req, res) => {
    const { role, isActive, search } = req.query;
    const filters = {
        role: role,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search,
        viewerId: req.user.id,
        viewerRole: req.user.role,
    };
    const result = await service.getUsers(filters);
    return ApiResponse(res, 200, 'Users fetched successfully', result);
});
export const createUser = asyncHandler(async (req, res) => {
    const result = await service.createUser(req.body, req.user.id);
    return ApiResponse(res, 201, 'User created successfully', result);
});
export const getUserById = asyncHandler(async (req, res) => {
    const result = await service.getUserById(req.params.id, req.user.id);
    return ApiResponse(res, 200, 'User fetched successfully', result);
});
export const updateUser = asyncHandler(async (req, res) => {
    const result = await service.updateAnyUser(req.params.id, req.body, req.user.id);
    return ApiResponse(res, 200, 'User updated successfully', result);
});
export const deleteUser = asyncHandler(async (req, res) => {
    const result = await service.softDeleteUser(req.params.id, req.user.id);
    return ApiResponse(res, 200, 'User deleted successfully (Soft delete)', result);
});
