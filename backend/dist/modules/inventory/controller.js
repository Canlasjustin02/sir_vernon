import * as service from './service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/apiResponse.js';
import ApiError from '../../core/apiError.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
export const createInventory = asyncHandler(async (req, res) => {
    const result = await service.createInventory(req.body);
    return ApiResponse(res, 201, 'Inventory item created successfully', result);
});
export const updateInventory = asyncHandler(async (req, res) => {
    const result = await service.updateInventory(req.params.id, req.body);
    return ApiResponse(res, 200, 'Inventory item updated successfully', result);
});
export const deleteInventory = asyncHandler(async (req, res) => {
    await service.deleteInventory(req.params.id);
    return ApiResponse(res, 200, 'Inventory item deleted successfully');
});
export const getInventoryById = asyncHandler(async (req, res) => {
    const result = await service.getInventoryById(req.params.id);
    return ApiResponse(res, 200, 'Inventory item fetched successfully', result);
});
export const getAllInventory = asyncHandler(async (req, res) => {
    const result = await service.getAllInventory(req.query);
    return ApiResponse(res, 200, 'All inventory items fetched successfully', result);
});
export const getInventoryByCategory = asyncHandler(async (req, res) => {
    const result = await service.getInventoryByCategory(req.params.category);
    return ApiResponse(res, 200, `Inventory items for category ${req.params.category} fetched successfully`, result);
});
export const markOrdered = asyncHandler(async (req, res) => {
    const result = await service.markAsOrdered(req.params.id, req.body.qty);
    return ApiResponse(res, 200, 'Reorder email sent and item marked as ordered', result);
});
export const confirmRestock = asyncHandler(async (req, res) => {
    const result = await service.confirmRestock(req.params.id, req.body?.qty);
    return ApiResponse(res, 200, 'Stock replenished successfully', result);
});
export const uploadInventoryImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload an image file');
    }
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'inventory');
    const result = await service.updateInventory(req.params.id, { imageUrl });
    return ApiResponse(res, 200, 'Inventory image uploaded successfully', result);
});
