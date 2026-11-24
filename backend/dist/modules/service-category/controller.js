import { ApiResponse } from '../../core/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as service from './service.js';
export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await service.getAllCategories();
    return ApiResponse(res, 200, 'Service categories retrieved successfully', categories);
});
export const getCategoryById = asyncHandler(async (req, res) => {
    const category = await service.getCategoryById(req.params.id);
    return ApiResponse(res, 200, 'Service category retrieved successfully', category);
});
export const createCategory = asyncHandler(async (req, res) => {
    const category = await service.createCategory(req.body);
    return ApiResponse(res, 201, 'Service category created successfully', category);
});
export const updateCategory = asyncHandler(async (req, res) => {
    const category = await service.updateCategory(req.params.id, req.body);
    return ApiResponse(res, 200, 'Service category updated successfully', category);
});
export const deleteCategory = asyncHandler(async (req, res) => {
    await service.deleteCategory(req.params.id);
    return ApiResponse(res, 200, 'Service category deleted successfully');
});
